import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';
import type { ChatMessage } from '../core/types';
import type { SendMessageOptions } from '../core/base-adapter';

export const QWEN_DEFAULT_MODEL = 'qwen3-max';

/**
 * Alibaba Qwen adapter (N.1, DashScope OpenAI-compatible mode).
 *
 * `:thinking` model suffix enables Qwen3 hybrid thinking
 * (`enable_thinking: true`, stripped before sending).
 */
export class QwenAdapter extends OpenAiCompatibleAdapter {
    constructor() {
        super('qwen', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', true);
    }

    protected override sanitizeModel(model: string): string {
        if (model === 'auto') return QWEN_DEFAULT_MODEL;
        return model.replace(/:thinking$/i, '');
    }

    protected override buildRequestBody(
        model: string,
        messages: ChatMessage[],
        stream: boolean | undefined,
        options: SendMessageOptions | undefined,
    ): Record<string, unknown> {
        const thinking = /:thinking$/i.test(model);
        const body = super.buildRequestBody(model, messages, stream, options);
        if (thinking) body.enable_thinking = true;
        return body;
    }
}
