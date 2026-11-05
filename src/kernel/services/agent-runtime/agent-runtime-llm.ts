import { PROVIDER_DEFAULT_MODELS } from '../../utils/provider-default-models';
import type { ToolLoopCallResult } from '../tool-loop/tool-loop';
import type { ToolCall } from '../../kernel/types/llm-types';

/** Минимальный интерфейс адаптера для LLM-вызова. */
interface LlmAdapter {
    sendMessage(
        messages: Array<{ role: string; content: string }>,
        model: string,
        key: string,
        opts?: unknown,
        extra?: { temperature?: number },
    ): Promise<{ content?: string; toolCalls?: unknown[]; tokens?: number }>;
}

export interface AgentLlmDeps {
    adapterRegistry: { getAdapter(provider: string): LlmAdapter | undefined };
    keyService: {
        getKeys?(): Array<{
            provider: string;
            key: string;
            status?: string;
            defaultModel?: string;
        }>;
    };
    /** Провайдер/модель по умолчанию (опционально). */
    defaultProvider?: string;
    defaultModel?: string;
}

/**
 * createAgentCallLlm — фабрика реального LLM-вызова для AgentRuntime.
 *
 * Выбирает первый активный ключ, резолвит адаптер и вызывает sendMessage.
 * При отсутствии ключа/адаптера/ошибке возвращает текст-ответ вместо throw.
 */
export function createAgentCallLlm(deps: AgentLlmDeps) {
    return async (
        messages: Array<{ role: string; content: string }>,

        _tools: unknown[],
    ): Promise<ToolLoopCallResult> => {
        const keys = deps.keyService.getKeys?.() ?? [];
        const key = keys.find((k) => k.status !== 'inactive');

        if (!key) {
            return { content: 'No LLM key available', toolCalls: [] };
        }

        const provider = key.provider || deps.defaultProvider || 'openrouter';
        const model =
            key.defaultModel ||
            deps.defaultModel ||
            PROVIDER_DEFAULT_MODELS[provider] ||
            'gpt-4o-mini';

        const adapter = deps.adapterRegistry.getAdapter(provider);
        if (!adapter) {
            return { content: `No adapter for ${provider}`, toolCalls: [] };
        }

        try {
            const response = await adapter.sendMessage(messages, model, key.key, undefined, {
                temperature: 0.7,
            });
            return {
                content: response?.content ?? '',
                toolCalls: (response?.toolCalls ?? []) as ToolCall[],
            };
        } catch (e) {
            return {
                content: `LLM error: ${e instanceof Error ? e.message : String(e)}`,
                toolCalls: [],
            };
        }
    };
}
