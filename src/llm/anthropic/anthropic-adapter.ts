import { BaseLLMAdapter, type SendMessageOptions } from '../core/base-adapter';
import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    ToolCall,
    Tool,
    StreamMeta,
} from '../core/types';
import { LLMError } from '../core/errors';
import { parseSSEStream } from '../http/sse-parser';
import { LLMHttpClient, PROVIDER_HTTP_TIMEOUT_MS } from '../http/llm-http-client';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('AnthropicAdapter');

/**
 * Phase 70, трасса B — Anthropic Messages API + Computer Use (`computer_20250124`).
 *
 * Проверено по документации (docs.anthropic.com, platform.claude.com, 2026):
 * - endpoint `POST /v1/messages`, headers `x-api-key` (сырой ключ, НЕ Bearer),
 *   `anthropic-version: 2023-06-01` (required);
 * - browser-CORS: `anthropic-dangerous-direct-browser-access: true`;
 * - `max_tokens` обязателен; `system` — top-level параметром (role 'system'
 *   во входных messages запрещён); роли только user/assistant, строго
 *   чередуются, первое сообщение — user;
 * - function-tools: `{ name, description, input_schema }`;
 * - computer-use (Claude 4 / Sonnet 3.7): инструмент
 *   `{ type: 'computer_20250124', name: 'computer', display_width_px,
 *   display_height_px }` + beta-header `computer-use-2025-01-24`
 *   (отправляется ТОЛЬКО когда computer-инструмент реально используется,
 *   отдельным HTTP-клиентом — см. ниже);
 * - ответ: content-блоки `text` / `tool_use`; результат хода — user-message
 *   с `tool_result` (`tool_use_id` + опциональный скриншот image-блоком);
 * - streaming SSE: `data:` JSON с полем `type` (`message_start`,
 *   `content_block_start/delta/stop`, `message_delta`, `message_stop`);
 *   текстовые дельты — `delta.type === 'text_delta'`, JSON tool-инпута —
 *   `delta.type === 'input_json_delta'` (`partial_json` склеивается по `index`).
 *
 * Маппинг на внутренние типы: `tool_use name==='computer'` →
 * `ToolCall.type 'computer_20250124'`, `function.arguments` = JSON raw input
 * (существующие потребители `call.function.name/arguments` работают без
 * ветвлений). Скриншоты едут через `ChatMessage.inlineData` в обе стороны.
 */

export const ANTHROPIC_API_BASE = 'https://api.anthropic.com';
export const ANTHROPIC_VERSION = '2023-06-01';
export const ANTHROPIC_COMPUTER_BETA = 'computer-use-2025-01-24';
export const ANTHROPIC_COMPUTER_TOOL_TYPE = 'computer_20250124';
export const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;
const IMAGE_BYTES_LIMIT = 5 * 1024 * 1024;

const ANTHROPIC_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export function normalizeFinishReason(reason: string | undefined): ProviderResponse['finishReason'] {
    switch (reason) {
        case 'end_turn':
        case 'stop_sequence':
            return 'STOP';
        case 'max_tokens':
            return 'MAX_TOKENS';
        case 'tool_use':
            return 'TOOL_CALLS';
        case undefined:
            return undefined;
        default:
            return 'OTHER';
    }
}

function safeParseArgs(raw: string): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed: unknown = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

function imageBlocks(
    inlineData: ChatMessage['inlineData'],
): Array<{ type: 'image'; source: { type: 'base64'; media_type: string; data: string } }> {
    const out: Array<{ type: 'image'; source: { type: 'base64'; media_type: string; data: string } }> = [];
    for (const part of inlineData ?? []) {
        const mime = part.mimeType.toLowerCase();
        if (!ANTHROPIC_MEDIA_TYPES.has(mime)) {
            LOGGER.warn('AnthropicAdapter', `Skipping inlineData with unsupported media type: ${part.mimeType}`);
            continue;
        }
        // H-09: скриншоты больше лимита режем на клиенте, а не роняем запрос.
        const approxBytes = Math.floor((part.data.length * 3) / 4);
        const data =
            approxBytes > IMAGE_BYTES_LIMIT
                ? part.data.slice(0, Math.floor((IMAGE_BYTES_LIMIT * 4) / 3))
                : part.data;
        out.push({ type: 'image', source: { type: 'base64', media_type: mime, data } });
    }
    return out;
}

export function mapTools(
    tools: Tool[] | undefined,
    computerUse: SendMessageOptions['computerUse'],
): { blocks: Array<Record<string, unknown>>; hasComputer: boolean } {
    const blocks: Array<Record<string, unknown>> = [];
    let hasComputer = false;
    for (const t of tools ?? []) {
        if (t.type === ANTHROPIC_COMPUTER_TOOL_TYPE || t.computer) {
            const width = Math.floor(t.computer?.displayWidthPx ?? computerUse?.displayWidthPx ?? 1024);
            const height = Math.floor(t.computer?.displayHeightPx ?? computerUse?.displayHeightPx ?? 768);
            blocks.push({
                type: ANTHROPIC_COMPUTER_TOOL_TYPE,
                name: 'computer',
                display_width_px: Math.max(1, width),
                display_height_px: Math.max(1, height),
            });
            hasComputer = true;
            continue;
        }
        const fn = t.function;
        if (!fn?.name) continue;
        blocks.push({
            name: fn.name,
            description: fn.description ?? '',
            input_schema: (fn.parameters ?? { type: 'object', properties: {} }) as Record<string, unknown>,
        });
    }
    if (computerUse && !hasComputer) {
        blocks.push({
            type: ANTHROPIC_COMPUTER_TOOL_TYPE,
            name: 'computer',
            display_width_px: Math.max(1, Math.floor(computerUse.displayWidthPx)),
            display_height_px: Math.max(1, Math.floor(computerUse.displayHeightPx)),
        });
        hasComputer = true;
    }
    return { blocks, hasComputer };
}

export function mapToolChoice(choice: unknown): Record<string, unknown> | undefined {
    if (choice === undefined) return undefined;
    if (typeof choice === 'string') {
        if (choice === 'auto' || choice === 'none') return { type: 'auto' };
        if (choice === 'required' || choice === 'any') return { type: 'any' };
        return undefined;
    }
    if (typeof choice === 'object' && choice !== null) {
        const c = choice as Record<string, unknown>;
        if (c['type'] === 'auto' || c['type'] === 'any' || c['type'] === 'tool') return { ...c };
    }
    return undefined;
}

/** Anthropic messages (одноролевые подряд смержены — API требует чередования). */
export function toAnthropicMessages(messages: ChatMessage[]): {
    system?: string;
    messages: Array<Record<string, unknown>>;
} {
    const systemParts: string[] = [];
    const out: Array<{ role: 'user' | 'assistant'; content: Array<Record<string, unknown>> }> = [];

    const push = (role: 'user' | 'assistant', blocks: Array<Record<string, unknown>>): void => {
        if (blocks.length === 0) return;
        const last = out[out.length - 1];
        if (last && last.role === role) last.content.push(...blocks);
        else out.push({ role, content: [...blocks] });
    };

    for (const m of messages) {
        if (m.role === 'system') {
            if (m.content) systemParts.push(m.content);
            continue;
        }
        if (m.role === 'tool') {
            const contentBlocks: Array<Record<string, unknown>> = [];
            if (m.content) contentBlocks.push({ type: 'text', text: m.content });
            contentBlocks.push(...imageBlocks(m.inlineData));
            const result: Record<string, unknown> = {
                type: 'tool_result',
                tool_use_id: m.toolCallId ?? '',
                content: contentBlocks.length > 0 ? contentBlocks : m.content,
            };
            // ToolRunner форматирует failures как `ERROR: ...` — честно маппим в is_error.
            if (m.content.startsWith('ERROR:')) result.is_error = true;
            push('user', [result]);
            continue;
        }
        const blocks: Array<Record<string, unknown>> = [];
        if (m.content) blocks.push({ type: 'text', text: m.content });
        for (const tc of m.toolCalls ?? []) {
            blocks.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.function.name,
                input: safeParseArgs(tc.function.arguments),
            });
        }
        blocks.push(...imageBlocks(m.inlineData));
        push(m.role, blocks);
    }

    if (out.length > 0 && out[0]?.role !== 'user') {
        throw new LLMError(
            'Anthropic: first non-system message must have role user (roles must alternate)',
            'anthropic',
            400,
        );
    }
    return {
        system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
        messages: out,
    };
}

export function extractToolCalls(content: Array<Record<string, unknown>> | undefined): ToolCall[] | undefined {
    if (!content) return undefined;
    const calls: ToolCall[] = [];
    for (const b of content) {
        if (b['type'] !== 'tool_use') continue;
        const name = String(b['name'] ?? '');
        calls.push({
            id: String(b['id'] ?? ''),
            type: name === 'computer' ? ANTHROPIC_COMPUTER_TOOL_TYPE : 'function',
            function: {
                name,
                arguments: JSON.stringify(b['input'] ?? {}),
            },
        });
    }
    return calls.length > 0 ? calls : undefined;
}

export function extractText(content: Array<Record<string, unknown>> | undefined): string {
    if (!content) return '';
    return content
        .filter((b) => b['type'] === 'text')
        .map((b) => String(b['text'] ?? ''))
        .join('');
}

/** Чистый парсинг non-streaming ответа `/v1/messages` (тестируемо без сети). */
export function parseAnthropicResponse(data: Record<string, unknown>): Omit<ProviderResponse, 'latency'> {
    const content = (data.content as Array<Record<string, unknown>> | undefined) ?? [];
    const usage = (data.usage as { input_tokens?: number; output_tokens?: number } | undefined) ?? {};
    return {
        content: extractText(content),
        tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        finishReason: normalizeFinishReason(data.stop_reason as string | undefined),
        toolCalls: extractToolCalls(content),
    };
}

function baseHeaders(): Record<string, string> {
    return {
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
    };
}

export class AnthropicAdapter extends BaseLLMAdapter {
    id = 'anthropic';
    private httpClient: LLMHttpClient;
    private computerHttpClient: LLMHttpClient;

    constructor(baseUrl: string = ANTHROPIC_API_BASE) {
        super();
        // C-01: нет /proxy/anthropic роута — прямые вызовы. x-api-key сырым
        // ключом (НЕ Bearer). Beta-header только у computer-клиента, чтобы
        // обычные запросы не тащили лишнего.
        // Оба клиента делят семафор/слоты и _inflight-реестр LLMHttpClient.
        this.httpClient = new LLMHttpClient(baseUrl, baseHeaders(), 'x-api-key', 'anthropic', PROVIDER_HTTP_TIMEOUT_MS);
        this.computerHttpClient = new LLMHttpClient(
            baseUrl,
            { ...baseHeaders(), 'anthropic-beta': ANTHROPIC_COMPUTER_BETA },
            'x-api-key',
            'anthropic',
            PROVIDER_HTTP_TIMEOUT_MS,
        );
    }

    protected override sanitizeModel(model: string): string {
        if (!model || model === 'auto') return ANTHROPIC_DEFAULT_MODEL;
        return model;
    }

    private buildBody(
        model: string,
        messages: ChatMessage[],
        stream: boolean | undefined,
        options: SendMessageOptions | undefined,
    ): { body: Record<string, unknown>; hasComputer: boolean } {
        const { system, messages: mapped } = toAnthropicMessages(messages);
        const { blocks: tools, hasComputer } = mapTools(options?.tools, options?.computerUse);
        const body: Record<string, unknown> = {
            model: this.sanitizeModel(model),
            max_tokens: Math.max(1, Math.floor(options?.maxOutputTokens ?? DEFAULT_MAX_TOKENS)),
            messages: mapped,
        };
        if (system !== undefined) body.system = system;
        if (tools.length > 0) body.tools = tools;
        const toolChoice = mapToolChoice(options?.toolChoice);
        if (toolChoice) body.tool_choice = toolChoice;
        if (options?.temperature !== undefined) body.temperature = options.temperature;
        if (options?.stopSequences !== undefined && options.stopSequences.length > 0) {
            body.stop_sequences = options.stopSequences;
        }
        if (stream) body.stream = true;
        return { body, hasComputer };
    }

    private clientFor(hasComputer: boolean): LLMHttpClient {
        return hasComputer ? this.computerHttpClient : this.httpClient;
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal?: AbortSignal,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const { body, hasComputer } = this.buildBody(model, messages, false, options);
        const { data } = await this.clientFor(hasComputer).post('/v1/messages', body, apiKey, signal);
        return parseAnthropicResponse(data as Record<string, unknown>);
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const { body, hasComputer } = this.buildBody(model, messages, true, options);
        const { response: res, release } = await this.clientFor(hasComputer).streamPost(
            '/v1/messages',
            body,
            apiKey,
            signal,
        );
        try {
            const toolBlocks = new Map<number, { id: string; name: string; json: string }>();
            let stopReason: string | undefined;
            let inputTokens = 0;
            let outputTokens = 0;

            await parseSSEStream(
                res,
                (chunk) => onChunk(chunk),
                (parsed) => {
                    const type = parsed.type as string | undefined;
                    if (type === 'message_start') {
                        const usage = (
                            parsed.message as { usage?: { input_tokens?: number } } | undefined
                        )?.usage;
                        if (typeof usage?.input_tokens === 'number') inputTokens = usage.input_tokens;
                        return undefined;
                    }
                    if (type === 'content_block_start') {
                        const index = Number(parsed.index ?? 0);
                        const block = (parsed.content_block ?? {}) as Record<string, unknown>;
                        if (block['type'] === 'tool_use') {
                            toolBlocks.set(index, {
                                id: String(block['id'] ?? ''),
                                name: String(block['name'] ?? ''),
                                json: '',
                            });
                        }
                        return undefined;
                    }
                    if (type === 'content_block_delta') {
                        const index = Number(parsed.index ?? 0);
                        const delta = (parsed.delta ?? {}) as Record<string, unknown>;
                        if (delta['type'] === 'text_delta') return delta['text'] as string | undefined;
                        if (delta['type'] === 'input_json_delta') {
                            const entry = toolBlocks.get(index);
                            if (entry) entry.json += String(delta['partial_json'] ?? '');
                        }
                        return undefined;
                    }
                    if (type === 'message_delta') {
                        const delta = (parsed.delta ?? {}) as { stop_reason?: string };
                        if (delta.stop_reason) stopReason = delta.stop_reason;
                        const usage = parsed.usage as { output_tokens?: number } | undefined;
                        if (typeof usage?.output_tokens === 'number') outputTokens = usage.output_tokens;
                        return undefined;
                    }
                    return undefined;
                },
                undefined,
                { signal, idleTimeoutMs: 30000 },
            );

            const toolCalls: ToolCall[] = [];
            for (const entry of toolBlocks.values()) {
                if (!entry.name) continue;
                toolCalls.push({
                    id: entry.id,
                    type: entry.name === 'computer' ? ANTHROPIC_COMPUTER_TOOL_TYPE : 'function',
                    function: { name: entry.name, arguments: entry.json || '{}' },
                });
            }
            if (stopReason || toolCalls.length > 0) {
                onChunk('', {
                    finishReason: normalizeFinishReason(stopReason),
                    tokens: inputTokens + outputTokens || undefined,
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                });
            }
        } finally {
            // H-5: снять регистрацию inflight + освободить слот.
            release();
        }
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
            const { data } = await this.httpClient.get('/v1/models', apiKey, signal);
            const list = (data as { data?: Array<{ id: string }> }).data;
            return list?.map((m) => m.id) ?? [];
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            return [];
        }
    }
}
