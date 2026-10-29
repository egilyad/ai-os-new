/**
 * BrowserUseService — Phase 70 (browser-use executor wiring).
 *
 * Замыкает обрыв №1 из второго аудита (ro2 §9): `ComputerService.act()`
 * возвращал stub `'queued ...'`, реального исполнителя не было.
 *
 * Сервис — тонкий executor ПОД существующими governance-слоями:
 *   - валидация sensitive-паттернов — через политику BrowserHarness
 *     (переиспользуем, не дублируем regex);
 *   - HITL — через AgemsApprovalService + ApprovalExecutionBridge
 *     (сервис сам approval НЕ запрашивает — это делает вызывающий
 *     код/bridge, иначе будет двойной вызов, см. ro2 §7);
 *   - policy-gate LLM-инструментов — через ToolGovernance в
 *     ToolRunner.callTool (автоматически).
 *
 * Два режима исполнения (по приоритету):
 *   1. direct sidecar — POST task на FastAPI sidecar
 *      (mcr.microsoft.com/playwright/python, см. docker/browser-use-sidecar).
 *      Для local-dev, когда gateway не поднят.
 *   2. gateway — POST /api/companies/:cid/runs → POST /api/runs/:id/execute
 *      с adapter 'browser-use'. Для docker/prod, когда sidecar за gateway.
 *
 * Ничего не знает про Anthropic CUA — это отдельная трасса (отложена).
 */

import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('BrowserUse');

export const BROWSER_USE_TASK_LIMIT = 8000;
export const BROWSER_USE_MAX_STEPS = 50;
const EXEC_TIMEOUT_MS = 90_000;
const RESULT_SLICE = 6000;
/** Транспортный лимит ответа (под скриншоты; совпадает с gateway MAX_OUTPUT_BYTES). */
const TRANSPORT_SLICE = 256 * 1024;

export interface BrowserUseConfig {
    sidecarUrl?: string;
    gatewayUrl?: string;
    gatewaySecret?: string;
    companyId?: string;
    allowedDomains?: string[];
    maxSteps?: number;
}

export interface BrowserUseResult {
    ok: boolean;
    via: 'sidecar' | 'gateway';
    stdout: string;
    screenshot?: string;
    actions?: unknown;
    finalState?: unknown;
}

export interface BrowserActResult {
    ok: boolean;
    via: 'sidecar';
    action: string;
    output: string;
    screenshot?: string;
}

export interface BrowserUseDeps {
    events: IEventBus;
    /** Резолвер конфига (localStorage/env). Если не задан — используется default. */
    getConfig?: () => BrowserUseConfig;
    /** Blocked-паттерны из BrowserHarnessPolicy (переиспользование, не дублирование). */
    blockedPatterns?: RegExp[];
}

function readDefaultConfig(): BrowserUseConfig {
    const cfg: BrowserUseConfig = {};
    try {
        const env = (import.meta as unknown as { env?: Record<string, string> })?.env;
        if (env?.['VITE_BROWSER_USE_SIDECAR_URL'])
            cfg.sidecarUrl = env['VITE_BROWSER_USE_SIDECAR_URL'];
        if (env?.['VITE_COMPANY_GATEWAY_URL']) cfg.gatewayUrl = env['VITE_COMPANY_GATEWAY_URL'];
    } catch {
        /* ignore — нет import.meta в тестах */
    }
    try {
        if (typeof localStorage !== 'undefined') {
            const sidecar = localStorage.getItem('browserUse.sidecarUrl');
            if (sidecar) cfg.sidecarUrl = sidecar;
            const gw = localStorage.getItem('companyGateway.url');
            if (gw) cfg.gatewayUrl = gw;
            const secret = localStorage.getItem('companyGateway.secret');
            if (secret) cfg.gatewaySecret = secret;
            const cid = localStorage.getItem('browserUse.companyId');
            if (cid) cfg.companyId = cid;
        }
    } catch {
        /* private mode / worker без localStorage */
    }
    // Нормализация: пустые строки — как отсутствие.
    for (const k of ['sidecarUrl', 'gatewayUrl', 'gatewaySecret', 'companyId'] as const) {
        if (typeof cfg[k] === 'string' && !(cfg[k] as string).trim()) delete cfg[k];
    }
    // Local-dev default: без явной настройки пробуем loopback-sidecar
    // (та же конвенция, что VITE_BROWSER_USE_SIDECAR_URL и плейсхолдеры
    // панели; loopback безопасен). Явный getConfig-инжект (тесты) имеет
    // приоритет и фолбэк НЕ получает — пусто значит пусто.
    if (!cfg.sidecarUrl && !(cfg.gatewayUrl && cfg.gatewaySecret && cfg.companyId)) {
        cfg.sidecarUrl = 'http://localhost:3100/execute';
    }
    return cfg;
}

function assertTask(task: string, blocked: RegExp[]): void {
    if (!task.trim()) throw new Error('browser.act: task is required');
    if (task.length > BROWSER_USE_TASK_LIMIT) {
        throw new Error(`browser.act: task too long (${task.length} > ${BROWSER_USE_TASK_LIMIT})`);
    }
    for (const re of blocked) {
        if (re.test(task)) throw new Error(`browser.act: sensitive pattern blocked (${re.source})`);
    }
}

function parseActResult(text: string): { output: string; screenshot?: string } {
    try {
        const p = JSON.parse(text) as { output?: unknown; screenshot?: string };
        return {
            output: typeof p.output === 'string' ? p.output : text.slice(0, RESULT_SLICE),
            screenshot: p.screenshot,
        };
    } catch {
        return { output: text.slice(0, RESULT_SLICE) };
    }
}

export class BrowserUseService {
    private deps: BrowserUseDeps;

    constructor(deps: BrowserUseDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        LOGGER.info('BrowserUse', 'init', {});
    }

    async destroy(): Promise<void> {
        // stateless — нечего закрывать
    }

    isConfigured(): boolean {
        const c = this.config();
        return Boolean(c.sidecarUrl || (c.gatewayUrl && c.gatewaySecret && c.companyId));
    }

    describe(): string {
        const c = this.config();
        if (c.sidecarUrl) return `sidecar ${c.sidecarUrl}`;
        if (c.gatewayUrl) return `gateway ${c.gatewayUrl}`;
        return 'not configured (set browserUse.sidecarUrl or companyGateway.* in localStorage)';
    }

    /** Проверка доступности sidecar/gateway (для UX: статус в панели). */
    async health(): Promise<{ ok: boolean; via: string; detail?: string }> {
        const c = this.config();
        if (c.sidecarUrl) {
            const url = c.sidecarUrl.replace(/\/$/, '');
            try {
                const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) });
                const ok = res.ok;
                return { ok, via: 'sidecar', detail: ok ? 'ready' : `HTTP ${res.status}` };
            } catch (e) {
                return {
                    ok: false,
                    via: 'sidecar',
                    detail: e instanceof Error ? e.message : String(e),
                };
            }
        }
        if (c.gatewayUrl && c.gatewaySecret && c.companyId) {
            return { ok: true, via: 'gateway', detail: 'configured' };
        }
        return { ok: false, via: 'none', detail: 'not configured' };
    }

    async execute(
        task: string,
        opts: { ticketId?: string; maxSteps?: number; signal?: AbortSignal } = {},
    ): Promise<BrowserUseResult> {
        assertTask(
            task,
            this.deps.blockedPatterns ?? [/password|passwd|card|cvv|otp|2fa|seed phrase/i],
        );
        const cfg = this.config();
        const maxSteps =
            opts.maxSteps !== undefined
                ? Math.max(1, Math.min(BROWSER_USE_MAX_STEPS, Math.floor(opts.maxSteps)))
                : Math.max(1, Math.min(BROWSER_USE_MAX_STEPS, Math.floor(cfg.maxSteps ?? 15)));

        if (cfg.sidecarUrl) {
            const stdout = await this.postSidecar(cfg.sidecarUrl, {
                task,
                ticketId: opts.ticketId,
                maxSteps,
                allowedDomains: cfg.allowedDomains,
                signal: opts.signal,
            });
            return this.parseResult('sidecar', stdout);
        }
        if (cfg.gatewayUrl && cfg.gatewaySecret && cfg.companyId) {
            const stdout = await this.viaGateway(cfg, { task, ticketId: opts.ticketId, maxSteps });
            return this.parseResult('gateway', stdout);
        }
        throw new Error(
            'browser-use not configured: set browserUse.sidecarUrl (direct) or companyGateway.url/secret + browserUse.companyId (gateway)',
        );
    }

    /**
     * Низкоуровневое действие sidecar (только прямой sidecar, не gateway):
     * `click_selector`, `extract_text_selector`, `extract_table`,
     * `extract_schema`, `open_url`, `type_text`, ...
     * Возвращает `{ output, screenshot }` из ответа `/act`.
     */
    async act(
        action: string,
        params: Record<string, unknown> = {},
        opts: { signal?: AbortSignal } = {},
    ): Promise<BrowserActResult> {
        const cfg = this.config();
        if (!cfg.sidecarUrl) {
            throw new Error(
                'browser sidecar not configured: set browserUse.sidecarUrl or run "npm run browser:sidecar"',
            );
        }
        const base = cfg.sidecarUrl.replace(/\/$/, '').replace(/\/execute$/, '');
        const url = `${base}/act`;
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), EXEC_TIMEOUT_MS);
        if (opts.signal) opts.signal.addEventListener('abort', () => ctl.abort(), { once: true });
        let res: Response;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...params }),
                signal: ctl.signal,
                redirect: 'manual',
            });
        } catch (e) {
            throw new Error(
                `browser sidecar недоступен по ${url}. Запусти его: npm run browser:sidecar ` +
                    `(или пропиши browserUse.sidecarUrl в localStorage). Подробности: ` +
                    `${e instanceof Error ? e.message : String(e)}`,
                { cause: e },
            );
        } finally {
            clearTimeout(timer);
        }
        const text = (await res.text()).slice(0, TRANSPORT_SLICE);
        if (res.status >= 300 && res.status < 400)
            throw new Error(`sidecar refused redirect (HTTP ${res.status})`);
        if (!res.ok) {
            let msg = `sidecar HTTP ${res.status}`;
            try {
                const p = JSON.parse(text) as { error?: unknown };
                if (p?.error) msg = String(p.error);
            } catch {
                /* keep HTTP status */
            }
            throw new Error(msg);
        }
        const { output, screenshot } = parseActResult(text);
        if (!output) throw new Error(`sidecar ${action}: пустой результат`);
        return { ok: true, via: 'sidecar', action, output, screenshot };
    }

    private config(): BrowserUseConfig {
        try {
            return this.deps.getConfig ? this.deps.getConfig() : readDefaultConfig();
        } catch {
            return {};
        }
    }

    private async postSidecar(
        sidecarUrl: string,
        payload: {
            task: string;
            ticketId?: string;
            maxSteps: number;
            allowedDomains?: string[];
            signal?: AbortSignal;
        },
    ): Promise<string> {
        const url = sidecarUrl.replace(/\/$/, '');
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), EXEC_TIMEOUT_MS);
        if (payload.signal) {
            payload.signal.addEventListener('abort', () => ctl.abort(), { once: true });
        }
        let res: Response;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ctl.signal,
                redirect: 'manual',
            });
        } catch (e) {
            // Транспорт упал до HTTP: sidecar не запущен/недоступен.
            // Говорим прямо, иначе пользователь видит голый 'fetch failed'.
            throw new Error(
                `browser sidecar недоступен по ${url}. Запусти его: npm run browser:sidecar ` +
                    `(или пропиши browserUse.sidecarUrl в localStorage). Подробности: ` +
                    `${e instanceof Error ? e.message : String(e)}`,
                { cause: e },
            );
        } finally {
            clearTimeout(timer);
        }
        // Транспортный лимит — под скриншоты (sidecar шлёт JPEG ~5-30 КБ):
        // резать короче = рвать JSON и терять screenshot (баг: в историю
        // падал сырой обрезанный blob вместо картинки).
        const text = (await res.text()).slice(0, TRANSPORT_SLICE);
        if (res.status >= 300 && res.status < 400)
            throw new Error(`sidecar refused redirect (HTTP ${res.status})`);
        if (!res.ok) throw new Error(`sidecar HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text;
    }

    private async viaGateway(
        cfg: BrowserUseConfig,
        input: { task: string; ticketId?: string; maxSteps: number },
    ): Promise<string> {
        const base = String(cfg.gatewayUrl).replace(/\/$/, '');
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.gatewaySecret}`,
        };
        const timeout = (ms: number): AbortSignal => AbortSignal.timeout(ms);

        // 1. Создать run (нужен running-run для /execute, см. sync-server.mjs).
        const runRes = await fetch(
            `${base}/api/companies/${encodeURIComponent(String(cfg.companyId))}/runs`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    trigger: 'manual',
                    input: { task: input.task.slice(0, 500) },
                }),
                signal: timeout(10_000),
            },
        );
        const runBody = (await runRes.json().catch(() => ({}))) as {
            run?: { id?: string };
            id?: string;
            error?: string;
        };
        if (!runRes.ok)
            throw new Error(
                `gateway create run failed: ${runBody.error || `HTTP ${runRes.status}`}`,
            );
        const runId = runBody.run?.id ?? runBody.id;
        if (!runId) throw new Error('gateway create run: no run id in response');

        // 2. Execute через browser-use адаптер.
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), EXEC_TIMEOUT_MS);
        try {
            const exRes = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}/execute`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    adapter: 'browser-use',
                    config: {
                        sidecarUrl: cfg.sidecarUrl,
                        maxSteps: input.maxSteps,
                        allowedDomains: cfg.allowedDomains,
                    },
                    input: { task: input.task, ticketId: input.ticketId },
                }),
                signal: ctl.signal,
            });
            const exBody = (await exRes.json().catch(() => ({}))) as {
                stdout?: string;
                error?: string;
            };
            if (!exRes.ok)
                throw new Error(
                    `gateway execute failed: ${exBody.error || `HTTP ${exRes.status}`}`,
                );
            return String(exBody.stdout ?? '');
        } finally {
            clearTimeout(timer);
        }
    }

    private parseResult(via: 'sidecar' | 'gateway', stdout: string): BrowserUseResult {
        let screenshot: string | undefined;
        let actions: unknown;
        let finalState: unknown;
        try {
            const parsed = JSON.parse(stdout) as Record<string, unknown>;
            if (typeof parsed['screenshot'] === 'string')
                screenshot = parsed['screenshot'] as string;
            actions = parsed['actions'];
            finalState = parsed['finalState'] ?? parsed['result'];
        } catch {
            // JSON мог прийти с текстовым мусором вокруг (прокси/лог-префиксы):
            // дотягиваем screenshot регуляркой, остальное — как plain text.
            const m = /"screenshot"\s*:\s*"([A-Za-z0-9+/=]+)"/.exec(stdout);
            if (m?.[1]) screenshot = m[1];
        }
        return {
            ok: true,
            via,
            stdout: stdout.slice(0, RESULT_SLICE),
            screenshot,
            actions,
            finalState,
        };
    }
}
