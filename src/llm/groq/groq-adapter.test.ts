import { describe, expect, it } from 'vitest';
import { GroqAdapter } from './groq-adapter';
import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';

describe('GroqAdapter', () => {
    it('использует общий OpenAI-совместимый стек вместо groq-sdk', () => {
        const adapter = new GroqAdapter();
        expect(adapter).toBeInstanceOf(OpenAiCompatibleAdapter);
        expect(adapter.id).toBe('groq');
    });
});
