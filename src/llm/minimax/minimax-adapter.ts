import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';

export const MINIMAX_DEFAULT_MODEL = 'MiniMax-M1';

/**
 * MiniMax adapter (N.1) — OpenAI-compatible endpoint, M1 default.
 */
export class MiniMaxAdapter extends OpenAiCompatibleAdapter {
    constructor() {
        super('minimax', 'https://api.minimax.io/v1', false); // C-01: no /proxy/minimax route
    }

    protected override sanitizeModel(model: string): string {
        if (model === 'auto') return MINIMAX_DEFAULT_MODEL;
        return model;
    }
}
