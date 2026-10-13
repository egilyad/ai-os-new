import { BaseLLMAdapter, type SendMessageOptions } from '../core/base-adapter';
import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    ToolCall,
    StreamMeta,
} from '../core/types';
import { LLMError } from '../core/errors';
import { LLMHttpClient, PROVIDER_HTTP_TIMEOUT_MS } from '../http/llm-http-client';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('GeminiComputerAdapter');

/**
 * Gemini Computer Use через Interactions API (документация ai.google.dev,
 * проверена 2026): ответ Anthropic-трассе B, но на Google-ключе.
 *
 * Протокол (Beta):
 * - `POST https://generativelanguage.googleapis.com/v1beta/interactions`,
 *   auth `x-goog-api-key` сырым ключом (тот же AI Studio key, что для Gemini);
 * - запрос: `{ model, input: "text" | [{type:'text',text} |
 *   {type:'image',data,mime_type}], tools: [{type:'computer_use',
 *   environment:'browser', enable_prompt_injection_detection:true}],
 *   previous_interaction_id? }`;
 * - ответ: `{ id, steps: [{type:'function_call', id, name,
 *   arguments:{x,y,...}} | {type:'model_output', content:[{text}]}] }`;
 * - следующий ход: `create({model, previous_interaction_id: id,
 *   input: [{type:'function_result', name, call_id,
 *   result: [{type:'text',text}, {type:'image',data,mime_type}]}]})`;
 * - координаты НОРМАЛИЗОВАНЫ 0..1000 → денормализуем под display size
 *   из `computerUse` (дефолт 1280x800 = viewport sidecar);
 * - `safety_decision: {decision:'require_confirmation'}` в аргументах =
 *   ход не исполняем, возвращаем объяснение текстом (loop завершается
 *   'done' с причиной — подтверждение человеком здесь = новый approve).
 *
 * Маппинг имён (Gemini → sidecar /act; непокрытые уходят как есть и честно
 * отвергаются актуатором `unknown action`):
 *   click_at/click → left_click, type_text_at → type,
 *   open_web_browser → screenshot (браузер уже открыт — обновляем вид),
 *   go_forward/go_back → go_forward/go_back, key_combination → key.
 *
 * Маппинг на внутренние типы: computer-вызовы едут как
 * `ToolCall.type 'computer_20250124'` (конверт «одно computer-действие
 * для loop», провайдеро-независимый; имя 20250124 историческое),
 * `function.arguments` = JSON sidecar-действия с АБСОЛЮТНЫМИ пикселями —
 * loop и sidecar дальше работают без изменений.
 *
 * Состояние цепочки: Interactions API stateful (previous_interaction_id),
 * а адаптеры shared — id храним в Map по `cacheScope.sessionId`
 * (loop выдаёт uuid на запуск; cap 50, чистка на терминальном ходе).
 * Без sessionId: первый ход работает, продолжение без цепочки — явная
 * ошибка вместо молчаливой потери контекста.
 */

export const GEMINI_COMPUTER_API_BASE = 'https://generativelanguage.googleapis.com';
export const GEMINI_COMPUTER_DEFAULT_MODEL = 'gemini-3.5-flash';
const SESSION_MAP_CAP = 50;

/** Gemini action → sidecar /act action. */
export function mapGeminiActionName(name: string): string {
    switch (name) {
        case 'click_at':
        case 'click':
            return 'left_click';
        case 'type_text_at':
            return 'type';
        case 'open_web_browser':
            return 'screenshot';
        case 'go_forward':
            return 'go_forward';
        case 'go_back':
            return 'go_back';
        case 'key_combination':
            return 'key';
        case 'drag_and_drop':
            return 'left_click_drag';
        default:
            return name;
    }
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

function toAbs(value: unknown, size: number): unknown {
    if (typeof value === 'number' && Number.isFinite(value)) {
        // Клэмп в [0, size-1]: модель любит ровно 1000 → size, а sidecar
        // отвергает x >= width (честная 422, но ход сгорает зря).
        return Math.max(0, Math.min(size - 1, Math.round((value / 1000) * size)));
    }
    return value;
}

/** Денормализация координат 0..1000 → абсолютные пиксели + чистка safety. */
export function denormalizeArgs(
    raw: Record<string, unknown>,
    displayWidthPx: number,
    displayHeightPx: number,
): { args: Record<string, unknown>; safetyNote?: string } {
    const args: Record<string, unknown> = {};
    let safetyNote: string | undefined;
    for (const [k, v] of Object.entries(raw)) {
        if (k === 'safety_decision') {
            const sd = (v ?? {}) as Record<string, unknown>;
            if (sd['decision'] === 'require_confirmation') {
                safetyNote = typeof sd['explanation'] === 'string' ? (sd['explanation'] as string) : 'confirmation required';
            }
            continue;
        }
        if (k === 'x' || k === 'start_x' || k === 'end_x') args[k] = toAbs(v, displayWidthPx);
        else if (k === 'y' || k === 'start_y' || k === 'end_y') args[k] = toAbs(v, displayHeightPx);
        else args[k] = v;
    }
    return { args, safetyNote };
}

function imageBlocks(inlineData: ChatMessage['inlineData']): Array<Record<string, unknown>> {
    const out: Array<Record<string, unknown>> = [];
    for (const part of inlineData ?? []) {
        const mime = part.mimeType.toLowerCase();
        if (mime !== 'image/png' && mime !== 'image/jpeg') {
            LOGGER.warn('GeminiComputerAdapter', `Skipping inlineData with media type: ${part.mimeType}`);
            continue;
        }
        out.push({ type: 'image', data: part.data, mime_type: mime });
    }
    return out;
}

export function buildFirstInput(messages: ChatMessage[]): Array<Record<string, unknown>> | string {
    const texts: string[] = [];
    const images: Array<Record<string, unknown>> = [];
    for (const m of messages) {
        if (m.role === 'system') {
            if (m.content) texts.push(m.content);
            continue;
        }
        if (m.role === 'tool') continue;
        if (m.content) texts.push(m.content);
        images.push(...imageBlocks(m.inlineData));
    }
    if (images.length === 0 && texts.length === 1) return texts[0] as string;
    const blocks: Array<Record<string, unknown>> = texts.map((t) => ({ type: 'text', text: t }));
    blocks.push(...images);
    return blocks;
}

/** Только tool-сообщения после последнего assistant = новые function_results. */
export function buildFunctionResults(messages: ChatMessage[]): Array<Record<string, unknown>> | null {
    let lastAssistant = -1;
    messages.forEach((m, i) => {
        if (m.role === 'assistant') lastAssistant = i;
    });
    const fresh = messages.slice(lastAssistant + 1).filter((m) => m.role === 'tool');
    if (fresh.length === 0) return null;
    return fresh.map((m) => {
        const result: Array<Record<string, unknown>> = [];
        if (m.content) result.push({ type: 'text', text: m.content });
        result.push(...imageBlocks(m.inlineData));
        return {
            type: 'function_result',
            // toolCallId tool-сообщения = id function_call прошлого хода.
            call_id: m.toolCallId ?? '',
            result,
        };
    });
}

export interface ParsedComputerCall {
    callId: string;
    name: string;
    args: Record<string, unknown>;
    safetyNote?: string;
}

export function extractSteps(
    steps: Array<Record<string, unknown>> | undefined,
    displayWidthPx: number,
    displayHeightPx: number,
): { text: string; calls: ParsedComputerCall[]; blockedNotes: string[] } {
    const texts: string[] = [];
    const calls: ParsedComputerCall[] = [];
    const blockedNotes: string[] = [];
    for (const step of steps ?? []) {
        if (step['type'] === 'model_output') {
            const content = (step['content'] ?? []) as Array<Record<string, unknown>>;
            for (const b of content) {
                if (typeof b['text'] === 'string') texts.push(b['text'] as string);
            }
            continue;
        }
        if (step['type'] !== 'function_call') continue;
        const rawArgs = isRecord(step['arguments']) ? (step['arguments'] as Record<string, unknown>) : {};
        const { args, safetyNote } = denormalizeArgs(rawArgs, displayWidthPx, displayHeightPx);
        if (safetyNote !== undefined) {
            blockedNotes.push(safetyNote);
            continue;
        }
        calls.push({
            callId: String(step['id'] ?? ''),
            name: String(step['name'] ?? ''),
            args,
        });
    }
    return { text: texts.join(''), calls, blockedNotes };
}

export class GeminiComputerAdapter extends BaseLLMAdapter {
    id = 'gemini-computer';
    private httpClient: LLMHttpClient;
    /** sessionId → previous_interaction_id (см. шапку про shared-адаптеры). */
    private chains = new Map<string, string>();

    constructor(baseUrl: string = GEMINI_COMPUTER_API_BASE) {
        super();
        // C-01: прямого /proxy/... роута под interactions нет — прямые вызовы,
        // тем же ключом и заголовком, что обычный GeminiAdapter.
        this.httpClient = new LLMHttpClient(
            baseUrl,
            { 'x-goog-api-client': 'genai-js/0.24.1' },
            'x-goog-api-key',
            'gemini-computer',
            PROVIDER_HTTP_TIMEOUT_MS,
        );
    }

    protected override sanitizeModel(model: string): string {
        if (!model || model === 'auto') return GEMINI_COMPUTER_DEFAULT_MODEL;
        return model;
    }

    private sessionKey(options: SendMessageOptions | undefined): string | undefined {
        return options?.cacheScope?.sessionId;
    }

    private remember(session: string, interactionId: string): void {
        if (this.chains.size >= SESSION_MAP_CAP) {
            const oldest = this.chains.keys().next();
            if (!oldest.done) this.chains.delete(oldest.value);
        }
        this.chains.set(session, interactionId);
    }

    private displaySize(options: SendMessageOptions | undefined): { w: number; h: number } {
        return {
            w: Math.max(1, Math.floor(options?.computerUse?.displayWidthPx ?? 1280)),
            h: Math.max(1, Math.floor(options?.computerUse?.displayHeightPx ?? 768)),
        };
    }

    private computerTool(): Record<string, unknown> {
        return { type: 'computer_use', environment: 'browser', enable_prompt_injection_detection: true };
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal?: AbortSignal,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const { w, h } = this.displaySize(options);
        const session = this.sessionKey(options);
        const freshResults = buildFunctionResults(messages);

        let body: Record<string, unknown>;
        if (freshResults) {
            // Продолжение цепочки: сервер держит историю, шлём только новые
            // function_results + previous_interaction_id.
            const chainedId = session ? this.chains.get(session) : undefined;
            if (!chainedId) {
                throw new LLMError(
                    'gemini-computer: continuation needs a chained interaction ' +
                        '(pass cacheScope.sessionId, one loop per session; chain lost on restart)',
                    this.id,
                    400,
                );
            }
            body = {
                model: this.sanitizeModel(model),
                previous_interaction_id: chainedId,
                input: freshResults,
                tools: [this.computerTool()],
            };
        } else {
            body = {
                model: this.sanitizeModel(model),
                input: buildFirstInput(messages),
                tools: [this.computerTool()],
            };
        }

        const { data } = await this.httpClient.post('/v1beta/interactions', body, apiKey, signal);
        const payload = data as {
            id?: string;
            steps?: Array<Record<string, unknown>>;
            error?: { message?: string };
        };
        const { text, calls, blockedNotes } = extractSteps(payload.steps, w, h);

        const toolCalls: ToolCall[] = calls.map((c) => ({
            id: c.callId,
            type: 'computer_20250124',
            function: {
                name: mapGeminiActionName(c.name),
                arguments: JSON.stringify({ action: mapGeminiActionName(c.name), ...c.args }),
            },
        }));

        if (session) {
            if (typeof payload.id === 'string' && payload.id) this.remember(session, payload.id);
            if (toolCalls.length === 0) this.chains.delete(session);
        }
        const blocked = blockedNotes.length > 0 ? `\n[blocked by safety policy: ${blockedNotes.join('; ').slice(0, 500)}]` : '';
        return {
            content: (text + blocked).slice(0, 8000),
            // Usage в документации interactions.create не описан — 0 честно
            // (cost-трекинг посчитает 0, а не выдуманные токены).
            tokens: 0,
            finishReason: toolCalls.length > 0 ? 'TOOL_CALLS' : blockedNotes.length > 0 ? 'OTHER' : 'STOP',
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        // Interactions API — не SSE: single-shot + финальная мета
        // (тот же приём, что classification-модели в OpenAI-совместимом).
        const res = await this.doSendMessage(messages, model, apiKey, options, signal);
        if (res.content) onChunk(res.content);
        onChunk('', { finishReason: res.finishReason, tokens: res.tokens || undefined, toolCalls: res.toolCalls });
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const models = await this.getAvailableModels(apiKey);
            if (models.length === 0) throw new LLMError('No models returned', this.id, 503);
            return { status: 'active', latency: Date.now() - start, models };
        } catch (e: unknown) {
            return {
                status: 'error',
                latency: Date.now() - start,
                models: [],
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        try {
            const { data } = await this.httpClient.get('/v1beta/models', apiKey, signal);
            const list = (data as { models?: Array<{ name?: string }> }).models;
            return (list ?? []).map((m) => String(m.name ?? '').replace(/^models\//, '')).filter(Boolean);
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            return [];
        }
    }
}
