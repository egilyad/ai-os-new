/**
 * ComputerUseLoopService — Phase 71 (CUA multi-turn loop, трасса B).
 *
 * Замыкает цикл «LLM → computer action → screenshot → LLM», которого нет
 * ни в ChatExecutor (один вызов без loop), ни в runWithTools (только
 * function-tools, maxRounds ≤ 5, без скриншот-фидбэка).
 *
 * Дизайн (без нового контура):
 * - LLM — штатный `ILLMClientService.chat` с `provider` ('anthropic' —
 *   AnthropicAdapter из трассы B, 'gemini-computer' — GeminiComputerAdapter
 *   на Interactions API тем же Google-ключом) и `computerUse`; скриншоты
 *   возвращаются как `tool_result` с `inlineData` — адаптеры маппят их
 *   в image-блоки;
 * - исполнение действий — через инжектированный `ComputerExecutor`
 *   (по умолчанию HTTP к sidecar `/act`, в тестах — мок);
 * - HITL — через готовый `AgemsApprovalService`: при `requireApproval`
 *   (default true) нужен `approvedRequestId`, указывающий на свежий
 *   APPROVED-запрос (replay/expiry проверяются здесь же, как в resolve);
 *   сам loop approval НЕ запрашивает — его создаёт вызывающий код, а после
 *   APPROVED вызывает loop напрямую или через ApprovalExecutionBridge;
 * - Бюджеты автономности из ApprovalPolicy агента — `executeMode`
 *   / `toolOverrides['computer.use']` решают судьбу запуска (BLOCKED —
 *   всегда запрет; FREE — approve-чек пропускается, если вызывающий его
 *   явно не требует; иначе — свежий APPROVED обязателен), а пресет режет
 *   `maxTurns` (FULL_CONTROL 5 / SUPERVISED 10 / GUIDED 15 / AUTOPILOT 30).
 *   Политика — потолок, вызов — только ужесточение;
 * - наблюдаемость — штатный `EVENTS.COMPUTER_ACT` на каждое действие
 *   (никаких новых типов событий).
 *
 * Сервис НЕ регистрируется как LLM-tool: иначе LLM мог бы вызывать
 * computer-loop без HITL. Вызов — программный (crew/graph/planner) или
 * через bridge после человеческого approve.
 *
 * Координаты — абсолютные пиксели Anthropic (display_width/height),
 * НЕ относительные 0..1000 harness-утилит.
 */

import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService, AdapterMessage } from '../../contracts/provider-adapter';
import type { ApprovalRequest, ApprovalPolicy, ApprovalPreset } from '../../types/agems-approval';
import { agemsApprovalService } from '../agems-approval-service';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ComputerUseLoop');

export const COMPUTER_LOOP_MAX_TURNS = 30;
export const COMPUTER_LOOP_DEFAULT_TURNS = 10;
/**
 * Бюджет автономности по пресетам AgemsApproval.
 * Глубокий loop без человека — привилегия, а не default: чем строже
 * пресет, тем короче потолок ходов.
 */
export const COMPUTER_LOOP_TURNS_BY_PRESET: Record<ApprovalPreset, number> = {
    FULL_CONTROL: 5,
    SUPERVISED: 10,
    GUIDED: 15,
    AUTOPILOT: 30,
};
/** Скриншот больше лимита не кладём в контекст — отдаём текстовый маркер. */
export const COMPUTER_SCREENSHOT_CHAR_LIMIT = 3_500_000;

export interface ComputerActionInput {
    action: string;
    [param: string]: unknown;
}

export interface ComputerActionResult {
    /** PNG base64 (без data: префикса). */
    screenshotBase64?: string;
    output?: string;
    /** Action-level ошибка (транспортные throw обрабатываются отдельно). */
    error?: string;
}

export interface ComputerExecutor {
    execute(action: ComputerActionInput, ctx: { ticketId?: string }): Promise<ComputerActionResult>;
}

export type ComputerUseProvider = 'anthropic' | 'gemini-computer';

export interface ComputerUseLoopOptions {
    agentId: string;
    task: string;
    displayWidthPx?: number;
    displayHeightPx?: number;
    model?: string;
    maxTurns?: number;
    ticketId?: string;
    /** HITL: id APPROVED-заявки (AgemsApprovalService). */
    approvedRequestId?: number;
    /** Default true — без свежего APPROVED loop не стартует. */
    requireApproval?: boolean;
    systemPrompt?: string;
    /**
     * LLM-провайдер computer-хода. Default 'anthropic'.
     * 'gemini-computer' — Gemini Computer Use (Interactions API) тем же
     * Google-ключом; координаты Gemini (0..1000) денормализуются адаптером
     * в абсолютные пиксели — loop и sidecar без изменений.
     */
    provider?: ComputerUseProvider;
}

export interface ComputerUseLoopResult {
    stopReason: 'done' | 'max_turns' | 'executor_error';
    turns: number;
    output: string;
    computerCalls: number;
    lastScreenshot?: string;
    /** Применённый потолок ходов после preset-cap (прозрачность для UI). */
    maxTurnsApplied: number;
}

export interface ComputerUseLoopDeps {
    events: IEventBus;
    llm: ILLMClientService;
    executor: ComputerExecutor;
    approval?: Pick<typeof agemsApprovalService, 'list' | 'getPolicy' | 'claim' | 'requestApproval'>;
}

export const REQUEST_AND_RUN_POLL_MS = 1000;
export const REQUEST_AND_RUN_TIMEOUT_MS = 10 * 60 * 1000;

/** Режим computer.use для агента из его ApprovalPolicy. */
export function resolveComputerMode(policy: ApprovalPolicy | undefined): 'BLOCKED' | 'REQUIRES_APPROVAL' | 'FREE' {
    const mode = policy?.toolOverrides?.['computer.use'] ?? policy?.executeMode ?? 'REQUIRES_APPROVAL';
    if (mode === 'BLOCKED' || mode === 'FREE' || mode === 'REQUIRES_APPROVAL') return mode;
    return 'REQUIRES_APPROVAL';
}

export function presetTurnsCap(policy: ApprovalPolicy | undefined): number {
    if (!policy) return COMPUTER_LOOP_DEFAULT_TURNS;
    return COMPUTER_LOOP_TURNS_BY_PRESET[policy.preset] ?? COMPUTER_LOOP_DEFAULT_TURNS;
}

const DEFAULT_SYSTEM = [
    'You control a computer through the computer tool. Coordinates are absolute',
    'pixels of the screenshot you receive after each action.',
    'Return one computer action per turn, then wait for the new screenshot.',
    'When the task is complete, answer with plain text and no tool calls.',
].join(' ');

function parseActionInput(raw: string): ComputerActionInput {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw || '{}');
    } catch {
        parsed = undefined;
    }
    const obj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const action = typeof obj['action'] === 'string' ? (obj['action'] as string) : '';
    if (!action.trim()) throw new Error('computer input has no action');
    return { ...obj, action };
}

export class ComputerUseLoopService {
    private deps: ComputerUseLoopDeps;

    constructor(deps: ComputerUseLoopDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        LOGGER.info('ComputerUseLoop', 'init', {});
    }

    async destroy(): Promise<void> {
        // stateless
    }

    /**
     * Программный путь «в один вызов» — запросить approve,
     * дождаться решения человека и запустить loop. В отличие от bridge
     * (fire-and-forget после approve) здесь вызывающий получает результат.
     * Poll Dexie с таймаутом; REJECTED/EXPIRED/таймаут — throw до первого
     * LLM-запроса. Неотвеченная заявка остаётся PENDING (видна в панели,
     * TTL закроет её позже) — это не ошибка вызывающего, но throw, чтобы
     * зависший вызов не молчал.
     */
    async requestAndRun(
        opts: Omit<ComputerUseLoopOptions, 'approvedRequestId' | 'requireApproval'> & {
            approvalTimeoutMs?: number;
            pollIntervalMs?: number;
        },
    ): Promise<ComputerUseLoopResult & { approvedRequestId: number }> {
        const approval = this.deps.approval ?? agemsApprovalService;
        if (typeof approval.requestApproval !== 'function') {
            throw new Error('computer.use: approval backend cannot request approvals');
        }
        const task = opts.task?.trim() ?? '';
        if (!task) throw new Error('computer.use: task is required');
        // Не дёргаем человека, если политика и так запрещает.
        try {
            const pre = await approval.getPolicy?.(opts.agentId);
            if (resolveComputerMode(pre) === 'BLOCKED') {
                throw new Error(`computer.use: blocked by approval policy for ${opts.agentId}`);
            }
        } catch (e) {
            if (e instanceof Error && /blocked by approval policy/.test(e.message)) throw e;
            // getPolicy недоступен/упал — дальше разберётся run().
        }
        const req = await approval.requestApproval({
            agentId: opts.agentId,
            toolName: 'computer.use',
            toolInput: { task, ticketId: opts.ticketId, provider: opts.provider ?? 'anthropic' },
            category: 'computer',
            riskLevel: 'high',
            description: `computer.use: ${task.slice(0, 200)}`,
        });
        const timeoutMs = Math.max(1000, Math.floor(opts.approvalTimeoutMs ?? REQUEST_AND_RUN_TIMEOUT_MS));
        const pollMs = Math.max(50, Math.floor(opts.pollIntervalMs ?? REQUEST_AND_RUN_POLL_MS));
        const deadline = Date.now() + timeoutMs;
        for (;;) {
            const found = ((await approval.list(opts.agentId)) as ApprovalRequest[]).find((r) => r.id === req.id);
            const status = found?.status;
            if (status === 'APPROVED') break;
            if (status === 'REJECTED' || status === 'EXPIRED') {
                throw new Error(`computer.use: approval ${req.id} was ${status?.toLowerCase() ?? 'lost'}`);
            }
            if (!found) throw new Error(`computer.use: approval ${req.id} disappeared`);
            if (Date.now() >= deadline) {
                throw new Error(`computer.use: approval ${req.id} timed out waiting for human decision`);
            }
            await new Promise((r) => setTimeout(r, pollMs));
        }
        // Явно требуем проверку: человек только что одобрил ЭТУ заявку —
        // run() перепроверит binding и сожжёт её через claim при любой
        // политике (иначе FREE-политика оставляла бы APPROVED переиспользуемым).
        const res = await this.run({ ...opts, task, approvedRequestId: req.id as number, requireApproval: true });
        return { ...res, approvedRequestId: req.id as number };
    }

    /**
     * Запуск по id заявки без доверия вызывающему.
     * agentId берётся ИЗ САМОЙ ЗАЯВКИ (проверенной ниже по binding),
     * а не из аргументов — иначе LLM подменит чужой approve, подсунув
     * свой agentId. Используется `computer.use` tool (bridge/LLM-путь).
     */
    async runApproved(input: {
        task: string;
        approvedRequestId: number | undefined;
        maxTurns?: number;
        ticketId?: string;
        model?: string;
        displayWidthPx?: number;
        displayHeightPx?: number;
        provider?: ComputerUseProvider;
    }): Promise<ComputerUseLoopResult> {
        const { approvedRequestId } = input;
        if (approvedRequestId === undefined) {
            throw new Error('computer.use: HITL approval required (pass approvedRequestId of an APPROVED request)');
        }
        const approval = this.deps.approval ?? agemsApprovalService;
        const all = (await approval.list()) as ApprovalRequest[];
        const req = all.find((r) => r.id === approvedRequestId);
        if (!req) throw new Error(`computer.use: approval request ${approvedRequestId} not found`);
        return this.run({
            agentId: req.agentId,
            task: input.task,
            approvedRequestId,
            maxTurns: input.maxTurns,
            ticketId: input.ticketId,
            model: input.model,
            displayWidthPx: input.displayWidthPx,
            displayHeightPx: input.displayHeightPx,
            provider: input.provider,
        });
    }

    async run(opts: ComputerUseLoopOptions): Promise<ComputerUseLoopResult> {
        const agentId = opts.agentId;
        if (!agentId) throw new Error('computer.use: agentId is required');
        const task = opts.task?.trim() ?? '';
        if (!task) throw new Error('computer.use: task is required');
        // ticketId идёт в события/логи/актуатор — режем до разумного.
        const ticketId = typeof opts.ticketId === 'string' ? opts.ticketId.slice(0, 120) : undefined;
        // Default совпадает с viewport sidecar (docker/browser-use-sidecar).
        const displayWidthPx = Math.max(1, Math.floor(opts.displayWidthPx ?? 1280));
        const displayHeightPx = Math.max(1, Math.floor(opts.displayHeightPx ?? 800));
        // Политика — потолок, вызов — только ужесточение.
        // BLOCKED запрещает всегда; FREE разрешает пропустить approve-чек
        // только если вызывающий явно не требует его (requireApproval !== true);
        // maxTurns режется preset-cap независимо от запроса.
        // getPolicy опционален в моках (старые тесты дают только list).
        let policy: ApprovalPolicy | undefined;
        try {
            policy = await this.deps.approval?.getPolicy?.(agentId);
        } catch {
            policy = undefined;
        }
        const mode = resolveComputerMode(policy);
        if (mode === 'BLOCKED') {
            throw new Error(`computer.use: blocked by approval policy for ${agentId}`);
        }
        const maxTurns = Math.max(
            1,
            Math.min(
                COMPUTER_LOOP_MAX_TURNS,
                presetTurnsCap(policy),
                Math.floor(opts.maxTurns ?? COMPUTER_LOOP_DEFAULT_TURNS),
            ),
        );

        // Default следует политике; явный флаг — переопределение;
        // BLOCKED абсолютен (см. выше). FREE + requireApproval:true =
        // ужесточение (проверяем); REQUIRES + requireApproval:false =
        // ответственность вызывающего (например, bridge уже проверил).
        const needCheck = opts.requireApproval ?? mode === 'REQUIRES_APPROVAL';
        if (needCheck) {
            await this.checkApproval(agentId, opts.approvedRequestId, {
                toolName: 'computer.use',
                task,
                provider: opts.provider ?? 'anthropic',
            });
            // Claim ДО loop — один approve = один запуск.
            // Транзиентный сбой loop сжигает approve (новый — новым запросом),
            // зато исключён повторный USE без человека.
            await (this.deps.approval ?? agemsApprovalService).claim(opts.approvedRequestId as number);
        }

        const messages: AdapterMessage[] = [
            { role: 'system', content: (opts.systemPrompt ?? DEFAULT_SYSTEM).slice(0, 4000) },
            { role: 'user', content: task.slice(0, 8000) },
        ];

        let computerCalls = 0;
        let lastScreenshot: string | undefined;
        const provider = opts.provider ?? 'anthropic';
        // Gemini Computer Use stateful (previous_interaction_id) — цепочка
        // привязывается к запуску через sessionId (shared-адаптер иначе
        // смешает параллельные loop'ы; см. GeminiComputerAdapter).
        const sessionId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

        for (let turn = 0; turn < maxTurns; turn++) {
            const res = await this.deps.llm.chat(messages, {
                provider,
                model: opts.model,
                maxTokens: 1024,
                computerUse: { displayWidthPx, displayHeightPx },
                cacheScope: { agentId, sessionId },
            });
            messages.push({
                role: 'assistant',
                content: res.content,
                toolCalls: (res.toolCalls ?? []).map((c) => ({ id: c.id, type: c.type, function: c.function })),
            });

            const calls = res.toolCalls ?? [];
            const computer = calls.filter((c) => c.type === 'computer_20250124');
            const functions = calls.filter((c) => c.type !== 'computer_20250124');

            // Function-tools в computer-loop не исполняем, но протокол требует
            // tool_result на каждый tool_use — отвечаем честной ошибкой.
            for (const f of functions) {
                messages.push({
                    role: 'tool',
                    toolCallId: f.id,
                    content: `ERROR: function tool '${f.function.name}' is not supported inside computer.use loop (computer actions only)`,
                });
            }

            // Выходим только когда вызовов нет вообще: ответы-ошибки на
            // function-tools модель должна увидеть следующим ходом.
            if (computer.length === 0 && functions.length === 0) {
                return { stopReason: 'done', turns: turn + 1, output: res.content, computerCalls, lastScreenshot, maxTurnsApplied: maxTurns };
            }

            for (const call of computer) {
                let input: ComputerActionInput;
                try {
                    input = parseActionInput(call.function.arguments);
                } catch (e) {
                    messages.push({
                        role: 'tool',
                        toolCallId: call.id,
                        content: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
                    });
                    continue;
                }
                this.deps.events.emit(EVENTS.COMPUTER_ACT, {
                    ticketId: ticketId ?? '',
                    action: `computer.${input.action.slice(0, 64)}`,
                });
                let result: ComputerActionResult;
                try {
                    result = await this.deps.executor.execute(input, { ticketId });
                } catch (e) {
                    // Транспорт мёртв — жечь оставшиеся turns бессмысленно.
                    const msg = e instanceof Error ? e.message : String(e);
                    LOGGER.warn('ComputerUseLoop', 'executor transport failed', { action: input.action, error: msg });
                    return {
                        stopReason: 'executor_error',
                        turns: turn + 1,
                        output: `executor transport failed: ${msg}`,
                        computerCalls,
                        lastScreenshot,
                        maxTurnsApplied: maxTurns,
                    };
                }
                computerCalls++;
                if (result.screenshotBase64) lastScreenshot = result.screenshotBase64;
                const shot =
                    result.screenshotBase64 && result.screenshotBase64.length <= COMPUTER_SCREENSHOT_CHAR_LIMIT
                        ? [{ mimeType: 'image/png', data: result.screenshotBase64 }]
                        : undefined;
                const overflow =
                    result.screenshotBase64 && result.screenshotBase64.length > COMPUTER_SCREENSHOT_CHAR_LIMIT
                        ? ' [screenshot dropped: exceeds context limit]'
                        : '';
                messages.push({
                    role: 'tool',
                    toolCallId: call.id,
                    content: result.error
                        ? `ERROR: ${result.error}${overflow}`
                        : `${result.output ?? `action ${input.action} done`}${overflow}`,
                    ...(shot ? { inlineData: shot } : {}),
                });
            }
        }

        return { stopReason: 'max_turns', turns: maxTurns, output: 'max turns reached', computerCalls, lastScreenshot, maxTurnsApplied: maxTurns };
    }

    /**
     * Привязка approve к запуску. Недостаточно «какого-то APPROVED
     * id» (их можно перебирать): заявка обязана принадлежать этому агенту,
     * быть выписана именно на `computer.use`, содержать ту же задачу и —
     * если заявитель указал провайдера — тот же провайдер. Иначе approve
     * под anthropic можно проиграть через gemini-путь (и наоборот).
     * Старые заявки без provider в toolInput привязываются только
     * по agent+tool+task (обратная совместимость).
     */
    private async checkApproval(
        agentId: string,
        approvedRequestId: number | undefined,
        bind?: { toolName?: string; task?: string; provider?: ComputerUseProvider },
    ): Promise<void> {
        if (approvedRequestId === undefined) {
            throw new Error('computer.use: HITL approval required (pass approvedRequestId of an APPROVED request)');
        }
        const approval = this.deps.approval ?? agemsApprovalService;
        const reqs = (await approval.list(agentId)) as ApprovalRequest[];
        const req = reqs.find((r) => r.id === approvedRequestId);
        if (!req) throw new Error(`computer.use: approval request ${approvedRequestId} not found for ${agentId}`);
        if (req.status !== 'APPROVED') {
            throw new Error(`computer.use: approval request ${approvedRequestId} is ${req.status} (needs APPROVED)`);
        }
        if (typeof req.expiresAt === 'number' && Date.now() > req.expiresAt) {
            throw new Error(`computer.use: approval request ${approvedRequestId} expired`);
        }
        if (bind?.toolName !== undefined && req.toolName !== bind.toolName) {
            throw new Error(
                `computer.use: approval ${approvedRequestId} covers '${req.toolName}', not '${bind.toolName}'`,
            );
        }
        if (bind?.task !== undefined) {
            const approvedTask = String((req.toolInput as Record<string, unknown> | null)?.['task'] ?? '').trim();
            if (approvedTask !== bind.task.trim()) {
                throw new Error(`computer.use: approval ${approvedRequestId} covers a different task`);
            }
        }
        if (bind?.provider !== undefined) {
            const approvedProvider = (req.toolInput as Record<string, unknown> | null)?.['provider'];
            if (typeof approvedProvider === 'string' && approvedProvider !== bind.provider) {
                throw new Error(
                    `computer.use: approval ${approvedRequestId} covers provider '${approvedProvider}', not '${bind.provider}'`,
                );
            }
        }
    }
}
