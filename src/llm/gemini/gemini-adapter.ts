import { BaseLLMAdapter, type SendMessageOptions } from '../core/base-adapter';
import type { ChatMessage, ProviderResponse, HealthCheckResult, StreamMeta } from '../core/types';
import { LLMHttpClient } from '../http/llm-http-client';
import { GeminiRequestBuilder } from './gemini-request-builder';
import { toProviderResponse } from './gemini-response-mapper';
import { GeminiStreamParser } from './gemini-stream-parser';
import type { GeminiResponse } from './gemini-types';
import { GeminiHealthCheck } from './gemini-health';
import { validateModel, modelCache } from './gemini-model-validator';
import { AuthError, SafetyError, RetryableError } from '../core/errors';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('GeminiAdapter');

const RETRYABLE_429_CODES = new Set([429]);
function isRetryable429(e: unknown): boolean {
    if (e instanceof RetryableError) return true;
    return RETRYABLE_429_CODES.has((e as { statusCode?: number })?.statusCode ?? 0);
}
async function with429Retry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await fn();
        } catch (e) {
            if (attempt === 0 && isRetryable429(e)) {
                await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
                continue;
            }
            throw e;
        }
    }
    throw new Error('Unreachable');
}

export class GeminiAdapter extends BaseLLMAdapter {
    id = 'gemini';

    private readonly healthCheck: GeminiHealthCheck;
    readonly #httpClient: LLMHttpClient;

    constructor(httpClient?: LLMHttpClient, baseURL?: string) {
        super();
        const url = baseURL ?? import.meta.env.VITE_PROXY_GEMINI ?? '/proxy/gemini';
        this.#httpClient =
            httpClient ??
            new LLMHttpClient(
                url,
                { 'x-goog-api-client': 'genai-js/0.24.1' },
                'x-goog-api-key',
                'Gemini',
            );
        this.healthCheck = new GeminiHealthCheck(this.#httpClient);
        modelCache.setFetcher((apiKey) =>
            this.healthCheck.getAvailableModels(apiKey).then((m) => new Set(m)),
        );
    }

    private isAuthError(e: unknown): boolean {
        if (e instanceof AuthError) return true;
        const sc = (e as { statusCode?: number })?.statusCode;
        return sc === 401 || sc === 403;
    }

    async doSendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options: SendMessageOptions | undefined,
        signal: AbortSignal | undefined,
    ): Promise<Omit<ProviderResponse, 'latency'>> {
        try {
            const safeModel = await validateModel(model, apiKey);
            const body = GeminiRequestBuilder.build(messages, options);
            const { data, latency } = await with429Retry(() =>
                this.#httpClient.post(
                    `/v1beta/models/${encodeURIComponent(safeModel)}:generateContent`,
                    body,
                    apiKey,
                    signal,
                ),
            );
            if (import.meta.env.DEV) {
                LOGGER.debug('GeminiAdapter', `response for ${safeModel}`, {
                    response: JSON.stringify(data).slice(0, 500),
                });
            }
            const raw = data as GeminiResponse;
            const result = toProviderResponse(raw, latency);
            if (result.error?.includes('blocked')) {
                throw new SafetyError(
                    this.id,
                    (result.finishReason ||
                        raw.promptFeedback?.blockReason ||
                        'SAFETY') as SafetyError['finishReason'],
                    result.safetyRatings,
                );
            }
            return result;
        } catch (e) {
            if (this.isAuthError(e)) modelCache.markFailed(apiKey);
            throw e;
        }
    }

    async doStreamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal: AbortSignal | undefined,
        options: SendMessageOptions | undefined,
    ): Promise<void> {
        try {
            const safeModel = await validateModel(model, apiKey);
            const body = GeminiRequestBuilder.build(messages, options);
            const res = await with429Retry(() =>
                this.#httpClient.streamPost(
                    `/v1beta/models/${encodeURIComponent(safeModel)}:streamGenerateContent?alt=sse`,
                    body,
                    apiKey,
                    signal,
                ),
            );
            await GeminiStreamParser.parse(res, onChunk, signal);
        } catch (e) {
            if (this.isAuthError(e)) modelCache.markFailed(apiKey);
            throw e;
        }
    }

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        return this.healthCheck.getAvailableModels(apiKey, signal);
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        return this.healthCheck.checkHealth(apiKey);
    }
}
