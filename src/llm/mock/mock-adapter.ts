import type {
    LLMProviderAdapter,
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    StreamMeta,
} from '../core/types';
import { LLMError } from '../core/errors';

export type MockMode = 'echo' | 'preset' | 'lorem' | 'error';

export interface MockAdapterOptions {
    mode?: MockMode;
    presetResponse?: string;
    simulateLatencyMs?: number;
    simulateTokens?: number;
    failWith?: string;
    models?: string[];
    healthStatus?: 'active' | 'error';
}

const LOREM =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export class MockAdapter implements LLMProviderAdapter {
    id = 'mock';

    private mode: MockMode;
    private presetResponse: string;
    private simulateLatencyMs: number;
    private simulateTokens: number;
    private failWith?: string;
    private models: string[];
    private healthStatus: 'active' | 'error';

    constructor(options?: MockAdapterOptions) {
        this.mode = options?.mode ?? 'echo';
        this.presetResponse =
            options?.presetResponse ?? 'This is a mock response from the sandbox adapter.';
        this.simulateLatencyMs = options?.simulateLatencyMs ?? 0;
        this.simulateTokens = options?.simulateTokens ?? 10;
        this.failWith = options?.failWith;
        this.models = options?.models ?? ['mock-model-v1', 'mock-model-v2'];
        this.healthStatus = options?.healthStatus ?? 'active';
    }

    private async delay(): Promise<void> {
        if (this.simulateLatencyMs > 0) {
            await new Promise((r) => setTimeout(r, this.simulateLatencyMs));
        }
    }

    private generateContent(messages: ChatMessage[]): string {
        switch (this.mode) {
            case 'echo':
                return messages.map((m) => `[${m.role}] ${m.content}`).join('\n');
            case 'preset':
                return this.presetResponse;
            case 'lorem':
                return `${LOREM}\n\n${LOREM}\n\n${LOREM}`;
            case 'error':
                throw new LLMError(
                    this.failWith ?? 'Simulated error from MockAdapter',
                    'mock',
                    500,
                );
        }
    }

    async sendMessage(
        messages: ChatMessage[],
        _model: string,
        _apiKey: string,
        _signal?: AbortSignal,
        _options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        if (this.failWith && this.mode === 'error') {
            throw new LLMError(this.failWith, 'mock', 500);
        }
        await this.delay();
        const content = this.generateContent(messages);
        return {
            content,
            latency: this.simulateLatencyMs,
            tokens: this.simulateTokens,
            finishReason: 'STOP',
        };
    }

    async streamMessage(
        messages: ChatMessage[],
        _model: string,
        _apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        _options?: SendMessageOptions,
    ): Promise<void> {
        if (this.failWith && this.mode === 'error') {
            throw new LLMError(this.failWith, 'mock', 500);
        }
        const content = this.generateContent(messages);
        const words = content.split(/(\s+)/);

        for (const word of words) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            await this.delay();
            onChunk(word);
        }

        onChunk('', { finishReason: 'STOP' });
    }

    async checkHealth(_apiKey: string): Promise<HealthCheckResult> {
        await this.delay();
        if (this.healthStatus === 'error') {
            return {
                status: 'error',
                latency: this.simulateLatencyMs,
                models: [],
                error: 'Simulated health check failure',
            };
        }
        return { status: 'active', latency: this.simulateLatencyMs, models: this.models };
    }

    async getAvailableModels(_apiKey: string, _signal?: AbortSignal): Promise<string[]> {
        return this.models;
    }
}
