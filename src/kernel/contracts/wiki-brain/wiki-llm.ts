export interface WikiLlmMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface WikiLlmClient {
    chat(
        messages: WikiLlmMessage[],
        options?: { model?: string; temperature?: number; maxTokens?: number },
    ): Promise<{ content: string }>;
}
