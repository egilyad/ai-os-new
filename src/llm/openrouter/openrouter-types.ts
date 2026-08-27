import { z } from 'zod';

export interface OpenRouterMessage {
    role: string;
    content: string;
}

export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    stop?: string | string[];
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
}

export interface OpenRouterChoice {
    index: number;
    message?: { role: string; content: string };
    delta?: { content?: string; reasoning?: string };
    finish_reason?: string;
}

export interface OpenRouterUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface OpenRouterResponse {
    id: string;
    choices: OpenRouterChoice[];
    usage?: OpenRouterUsage;
    error?: { message: string; type: string };
    model?: string;
    provider?: string;
    system_fingerprint?: string;
}

export const OpenRouterResponseSchema = z.object({
    id: z.string().nullish(),
    choices: z
        .array(
            z.object({
                index: z.number().nullish(),
                message: z.object({ role: z.string(), content: z.string().nullish() }).nullish(),
                delta: z
                    .object({ content: z.string().nullish(), reasoning: z.string().nullish() })
                    .nullish(),
                finish_reason: z.string().nullish(),
            }),
        )
        .nullish(),
    usage: z
        .object({
            prompt_tokens: z.number().nullish(),
            completion_tokens: z.number().nullish(),
            total_tokens: z.number().nullish(),
        })
        .nullish(),
    error: z
        .object({
            message: z.string(),
            type: z.string().nullish(),
            code: z.union([z.string(), z.number()]).nullish(),
        })
        .nullish(),
    model: z.string().nullish(),
    provider: z.string().nullish(),
    system_fingerprint: z.string().nullish(),
});
