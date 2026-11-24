import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';

/**
 * Groq speaks the OpenAI-compatible API. Route through the shared HTTP stack
 * (proxy, SSRF guards, timeouts, decorators) instead of the groq-sdk client —
 * the SDK created a separate request path that bypassed the LLM middleware.
 */
export class GroqAdapter extends OpenAiCompatibleAdapter {
    override id = 'groq';

    constructor() {
        super('groq', 'https://api.groq.com/openai/v1', true);
    }
}
