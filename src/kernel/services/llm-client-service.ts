import type {
    IProviderAdapter,
    IAdapterRegistry,
    ILLMClientConfig,
    ILLMClientService,
    ILLMClientChatOptions,
    AdapterMessage,
    AdapterResponse,
    ToolCall,
    AdapterFinishReason,
} from '../contracts/provider-adapter';
import { ProviderAdapterRegistry } from './provider-adapter-registry';

export class LLMClientService implements ILLMClientService {
    private registry: IAdapterRegistry;
    private config: ILLMClientConfig;

    constructor(config: ILLMClientConfig, registry?: IAdapterRegistry) {
        this.config = config;
        this.registry = registry ?? new ProviderAdapterRegistry();
    }

    private getAdapter(provider: string): IProviderAdapter {
        const adapter = this.registry.getAdapter(provider);
        if (!adapter) throw new Error(`No adapter found for provider: ${provider}`);
        return adapter;
    }

    private getApiKey(provider: string, override?: string): string {
        const key = override ?? this.config.resolveApiKey(provider);
        if (!key) throw new Error(`No API key configured for provider: ${provider}`);
        return key;
    }

    async chat(
        messages: AdapterMessage[],
        options?: ILLMClientChatOptions,
    ): Promise<AdapterResponse> {
        const provider = options?.provider || this.config.defaultProvider;
        if (!provider) throw new Error('No provider specified and no default configured');

        const adapter = this.getAdapter(provider);
        const model = options?.model || this.config.defaultModel || 'auto';
        const apiKey = this.getApiKey(provider, options?.apiKeyOverride);

        const sendMessageOpts: import('../../kernel/types/llm-types').SendMessageOptions = {};
        if (options?.priority) sendMessageOpts.priority = options.priority;
        if (options?.temperature !== undefined) sendMessageOpts.temperature = options.temperature;
        if (options?.maxTokens !== undefined) sendMessageOpts.maxOutputTokens = options.maxTokens;
        if (options?.stopSequences !== undefined)
            sendMessageOpts.stopSequences = options.stopSequences;
        if (options?.tools !== undefined)
            sendMessageOpts.tools =
                options.tools as import('../../kernel/types/llm-types').SendMessageOptions['tools'];
        if (options?.toolChoice !== undefined) sendMessageOpts.toolChoice = options.toolChoice;
        if (options?.responseFormat !== undefined)
            sendMessageOpts.responseFormat = options.responseFormat;
        if (options?.cacheScope !== undefined) sendMessageOpts.cacheScope = options.cacheScope;

        const hasOpts = Object.keys(sendMessageOpts).length > 0;
        const finalOpts = hasOpts ? sendMessageOpts : undefined;

        if (options?.onChunk) {
            if (adapter.streamMessage) {
                let content = '';
                const startTime = Date.now();
                let finalMeta: Record<string, unknown> | undefined;

                await adapter.streamMessage(
                    messages,
                    model,
                    apiKey,
                    (chunk, meta) => {
                        content += chunk;
                        if (meta)
                            finalMeta = { ...finalMeta, ...(meta as Record<string, unknown>) };
                        options.onChunk?.(chunk, meta);
                    },
                    options.signal,
                    finalOpts,
                );

                const latency = Date.now() - startTime;
                const meta = finalMeta as Record<string, unknown> | undefined;
                const finishReasonRaw = meta?.finishReason;
                const validFinishReasons: AdapterFinishReason[] = [
                    'STOP',
                    'MAX_TOKENS',
                    'SAFETY',
                    'RECITATION',
                    'OTHER',
                    'TOOL_CALLS',
                ];
                const finishReason =
                    typeof finishReasonRaw === 'string' &&
                    validFinishReasons.includes(finishReasonRaw as AdapterFinishReason)
                        ? (finishReasonRaw as AdapterFinishReason)
                        : undefined;
                return {
                    latency: typeof meta?.latency === 'number' ? meta.latency : latency,
                    tokens:
                        typeof meta?.tokens === 'number'
                            ? meta.tokens
                            : Math.ceil(content.length / 4),
                    finishReason,
                    toolCalls: Array.isArray(meta?.toolCalls) ? meta.toolCalls : undefined,
                    safetyRatings: Array.isArray(meta?.safetyRatings)
                        ? meta.safetyRatings
                        : undefined,
                    groundingMetadata:
                        meta?.groundingMetadata as AdapterResponse['groundingMetadata'],
                    reasoning: typeof meta?.reasoning === 'string' ? meta.reasoning : undefined,
                    content,
                };
            }

            const response = await adapter.sendMessage(
                messages,
                model,
                apiKey,
                options?.signal,
                finalOpts,
            );
            options.onChunk(response.content);
            return response;
        }

        return adapter.sendMessage(messages, model, apiKey, options?.signal, finalOpts);
    }

    async sendMessage(
        messages: AdapterMessage[],
        options?: ILLMClientChatOptions,
    ): Promise<{
        content: string;
        toolCalls?: ToolCall[];
        latency: number;
        tokens: number;
        error?: string;
        finishReason?: AdapterFinishReason;
    }> {
        const res = await this.chat(messages, options);
        return {
            content: res.content,
            toolCalls: res.toolCalls,
            latency: res.latency,
            tokens: res.tokens,
            error: res.error,
            finishReason: res.finishReason,
        };
    }
}
