import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';
import type { ChatMessage } from '../core/types';
import type { SendMessageOptions } from '../core/base-adapter';

export const KIMI_DEFAULT_MODEL = 'kimi-k2';
export const KIMI_THINKING_MODEL = 'kimi-k2-thinking';

/**
 * Moonshot Kimi adapter (N.1).
 *
 * OpenAI-compatible endpoint with K2 defaults. `:thinking` model suffix
 * selects the thinking variant (stripped before sending).
 */
export class KimiAdapter extends OpenAiCompatibleAdapter {
    constructor() {
        super('kimi', 'https://api.moonshot.ai/v1', true);
    }

    protected override sanitizeModel(model: string): string {
        if (model === 'auto') return KIMI_DEFAULT_MODEL;
        return model;
    }

    protected override buildRequestBody(
        model: string,
        messages: ChatMessage[],
        stream: boolean | undefined,
        options: SendMessageOptions | undefined,
    ): Record<string, unknown> {
        const thinking = /:thinking$/i.test(model);
        const clean = thinking ? model.replace(/:thinking$/i, '') : model;
        return super.buildRequestBody(clean || KIMI_DEFAULT_MODEL, messages, stream, options);
    }
}
