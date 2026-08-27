import { describe, it, expect, vi } from 'vitest';
import { GeminiAdapter } from './gemini-adapter';
import { LLMHttpClient } from '../http/llm-http-client';
import type { ChatMessage } from '../core/types';

describe('GeminiAdapter', () => {
    const mockHttpClient = {
        post: vi.fn(),
        streamPost: vi.fn(),
    } as unknown as LLMHttpClient;

    it('should map tool declarations and parse functionCall responses correctly', async () => {
        const adapter = new GeminiAdapter(mockHttpClient);
        const messages: ChatMessage[] = [
            { role: 'user', content: 'What is the weather in Paris?' },
        ];

        const mockResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                functionCall: {
                                    name: 'get_weather',
                                    args: { location: 'Paris' },
                                },
                            },
                        ],
                    },
                    finishReason: 'STOP',
                    safetyRatings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            probability: 'NEGLIGIBLE',
                            blocked: false,
                        },
                    ],
                },
            ],
            usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 15,
                totalTokenCount: 25,
            },
        };

        vi.mocked(mockHttpClient.post).mockResolvedValue({
            data: mockResponse,
            latency: 120,
            response: new Response(),
        });

        const result = await adapter.sendMessage(
            messages,
            'gemini-3.1-flash-lite',
            'fake-api-key',
            undefined,
            {
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'get_weather',
                            description: 'Get weather details',
                            parameters: {
                                type: 'object',
                                properties: {
                                    location: { type: 'string' },
                                },
                                required: ['location'],
                            },
                        },
                    },
                ],
            },
        );

        expect(mockHttpClient.post).toHaveBeenCalled();
        const [path, body, apiKey] = vi.mocked(mockHttpClient.post).mock.calls[0];
        expect(path).toContain('/v1beta/models/gemini-3.1-flash-lite:generateContent');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).tools[0].functionDeclarations[0].name).toBe('get_weather');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).tools[0].functionDeclarations[0].parameters.type).toBe('OBJECT');
        expect(apiKey).toBe('fake-api-key');

        expect(result.finishReason).toBe('TOOL_CALLS');
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls![0].function.name).toBe('get_weather');
        expect(JSON.parse(result.toolCalls![0].function.arguments).location).toBe('Paris');
    });

    it('should handle G3 structured output generation config parameters', async () => {
        const adapter = new GeminiAdapter(mockHttpClient);
        const messages: ChatMessage[] = [{ role: 'user', content: 'Output JSON schema' }];

        vi.mocked(mockHttpClient.post).mockResolvedValue({
            data: {
                candidates: [
                    { content: { parts: [{ text: '{"success": true}' }] }, finishReason: 'STOP' },
                ],
            },
            latency: 50,
            response: new Response(),
        });

        await adapter.sendMessage(messages, 'gemini-3.1-flash-lite', 'fake-api-key', undefined, {
            responseFormat: {
                type: 'json_object',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                    },
                },
            },
        });

        const [, body] = vi.mocked(mockHttpClient.post).mock.calls[1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).generationConfig.responseMimeType).toBe('application/json');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).generationConfig.responseSchema.type).toBe('OBJECT');
    });

    it('should handle G4 safety settings', async () => {
        const adapter = new GeminiAdapter(mockHttpClient);
        const messages: ChatMessage[] = [{ role: 'user', content: 'Verify safety settings' }];

        vi.mocked(mockHttpClient.post).mockResolvedValue({
            data: {
                candidates: [{ content: { parts: [{ text: 'Safe' }] }, finishReason: 'STOP' }],
            },
            latency: 50,
            response: new Response(),
        });

        await adapter.sendMessage(messages, 'gemini-3.1-flash-lite', 'fake-api-key', undefined, {
            safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            ],
        });

        const [, body] = vi.mocked(mockHttpClient.post).mock.calls[2];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).safetySettings).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).safetySettings[0].category).toBe('HARM_CATEGORY_DANGEROUS_CONTENT');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((body as any).safetySettings[0].threshold).toBe('BLOCK_LOW_AND_ABOVE');
    });
});
