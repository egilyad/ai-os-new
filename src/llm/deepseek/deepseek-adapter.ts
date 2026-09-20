import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';
import type { ChatMessage } from '../core/types';
import type { SendMessageOptions } from '../core/base-adapter';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('DeepSeekAdapter');

export const DEEPSEEK_CHAT_MODEL = 'deepseek-chat';
export const DEEPSEEK_REASONER_MODEL = 'deepseek-reasoner';

/**
 * Dedicated DeepSeek adapter (N.1, protocol-quirks aware).
 *
 * - `deepseek-reasoner` (or `:thinking`) models get `reasoning_effort:
 *   medium` unless overridden; thinking models consume reasoning tokens.
 * - `reasoning_content` round-trip: assistant messages carrying
 *   `reasoningContent` pass it through verbatim (DeepSeek returns 400
 *   without it in multi-turn tool loops).
 * - Context guard: warns past ~900K tokens (1M hard ceiling, unannounced).
 */
export class DeepSeekAdapter extends OpenAiCompatibleAdapter {
    constructor() {
        super('deepseek', 'https://api.deepseek.com/v1', false); // C-01: no /proxy/deepseek route
    }

    protected override sanitizeModel(model: string): string {
        if (model === 'auto') return DEEPSEEK_CHAT_MODEL;
        return model;
    }

    protected override buildRequestBody(
        model: string,
        messages: ChatMessage[],
        stream: boolean | undefined,
        options: SendMessageOptions | undefined,
    ): Record<string, unknown> {
        const body = super.buildRequestBody(model, messages, stream, options);
        const isReasoner = /reasoner|thinking/i.test(model);
        if (isReasoner && !('reasoning_effort' in body)) {
            body.reasoning_effort = 'medium';
        }
        const approxTokens = JSON.stringify(messages).length / 4;
        if (approxTokens > 900000) {
            LOGGER.warn('DeepSeekAdapter', `Near 1M context ceiling (~${Math.round(approxTokens)} tokens)`);
        }
        return body;
    }
}
