import { BaseLLMAdapter, type SendMessageOptions } from '../core/base-adapter';
import type { ChatMessage, ProviderResponse, HealthCheckResult, StreamMeta } from '../core/types';
import { LLMError } from '../core/errors';
import { parseSSEStream } from '../http/sse-parser';
import { LLMHttpClient } from '../http/llm-http-client';

const CLOUDFLARE_FREE_TIER = { requestsPerDay: 14400, tokensPerDay: 1000000 };
const DEFAULT_BASE_URL = 'https://api.cloudflare.com/client/v4/accounts';

/**
 * Cloudflare Workers AI adapter.
 * API key format: "{account_id}:{api_token}" — the adapter extracts both.
 */
export class CloudflareAdapter extends BaseLLMAdapter {
    readonly id = 'cloudflare';
    private baseUrl: string;
    private useProxy: boolean;
    private httpClient: LLMHttpClient;

    constructor(baseUrl?: string, useProxy = true) {
        super();
        this.baseUrl = baseUrl || DEFAULT_BASE_URL;
        this.useProxy = useProxy;
        // HTTP-client timeout must exceed the debate-caller's large-model timeout
        // (getLargeModelTimeoutMs = 90s). Otherwise the HTTP layer's 60s timer fires
        // first with a bare AbortError, which debate-llm-caller treats as a user abort
        // (no retry) instead of its own RequestTimedOut (retried).
        this.httpClient = new LLMHttpClient('', {}, 'authorization', 'cloudflare', 120000);
    }

    private parseAuth(apiKey: string): { accountId: string; token: string } {
        const parts = apiKey.split(':');
        if (parts.length >= 2) {
            const accountId = parts[0];
            const token = parts.slice(1).join(':');
            if (accountId && !/^[a-zA-Z0-9-]+$/.test(accountId)) {
                throw new LLMError('Invalid Cloudflare account ID format', this.id, 400);
            }
            return { accountId: accountId!, token };
        }
        return { accountId: '', token: apiKey };
    }

    private getUrl(apiKey: string, path: string): string {
        const { accountId } = this.parseAuth(apiKey);
        const base = this.useProxy ? `/proxy/cloudflare` : this.baseUrl;
        if (accountId) {
            return `${base}/${accountId}/ai/v1${path}`;
        }
        return `${base}${path}`;
    }

    private buildBody(
        model: string,
        messages: ChatMessage[],
        stream?: boolean,
        options?: SendMessageOptions,
    ): Record<string, unknown> {
        return this.buildRequestBody(model, messages, stream, options, {
            omitFields: ['safetySettings', 'cachedContent'],
        });
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal?: AbortSignal,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        const { token } = this.parseAuth(apiKey);
        const body = this.buildBody(model, messages, false, options);
        const url = this.getUrl(apiKey, '/chat/completions');

        const result = await this.httpClient.post(url, body, `Bearer ${token}`, signal);
        const data = result.data as {
            choices?: Array<{ message?: { content?: unknown } }>;
            result?: { response?: unknown; usage?: { total_tokens?: number } };
            usage?: { total_tokens?: number };
        };
        const content = data.choices?.[0]?.message?.content ?? data.result?.response ?? '';
        return {
            content: typeof content === 'string' ? content : String(content ?? ''),
            tokens: data.usage?.total_tokens ?? data.result?.usage?.total_tokens ?? 0,
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
        const { token } = this.parseAuth(apiKey);
        const body = this.buildBody(model, messages, true, options);
        const url = this.getUrl(apiKey, '/chat/completions');

        const res = await this.httpClient.streamPost(url, body, `Bearer ${token}`, signal);

        let finalFinishReason: string | undefined;

        await parseSSEStream(
            res,
            (chunk) => onChunk(chunk),
            (parsed) => {
                const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
                const choice = choices?.[0];
                const delta = choice?.delta as { content?: string } | undefined;
                if (choice?.finish_reason) finalFinishReason = choice.finish_reason as string;
                return delta?.content ?? (parsed.response as string) ?? undefined;
            },
            undefined,
            { idleTimeoutMs: 30000, signal },
        );

        if (finalFinishReason) {
            onChunk('', { finishReason: finalFinishReason });
        }
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const models = await this.getAvailableModels(apiKey);
            return {
                status: models.length > 0 ? 'active' : 'error',
                latency: Date.now() - start,
                models,
            };
        } catch (e: unknown) {
            return {
                status: 'error',
                latency: Date.now() - start,
                models: [],
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }

    private _lastModelFetchFail = 0;
    private static MODEL_FETCH_RETRY_MS = 300_000;

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        if (
            this._lastModelFetchFail &&
            Date.now() - this._lastModelFetchFail < CloudflareAdapter.MODEL_FETCH_RETRY_MS
        ) {
            return [];
        }
        const { token, accountId } = this.parseAuth(apiKey);
        try {
            const base = this.useProxy ? `/proxy/cloudflare` : this.baseUrl;
            const url = accountId ? `${base}/${accountId}/ai/v1/models/search` : `${base}/models`;
            const result = await this.httpClient.get(url, `Bearer ${token}`, signal);
            const data = result.data as {
                success?: boolean;
                result?: Array<{ id: string; name?: string }>;
            };
            if (data.success && Array.isArray(data.result)) {
                this._lastModelFetchFail = 0;
                return data.result.map((m) => m.id || m.name).filter(Boolean) as string[];
            }
            this._lastModelFetchFail = 0;
            return [];
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            this._lastModelFetchFail = Date.now();
            return [];
        }
    }

    getFreeTier() {
        return CLOUDFLARE_FREE_TIER;
    }
}
