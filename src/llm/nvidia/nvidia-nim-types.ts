import { z } from 'zod';

export interface NvidiaNIMChoice {
    index: number;
    message?: { role: string; content: string };
    delta?: { content?: string; reasoning?: string };
    finish_reason?: string;
}

export interface NvidiaNIMUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface NvidiaNIMResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: NvidiaNIMChoice[];
    usage?: NvidiaNIMUsage;
}

export const NvidiaNIMResponseSchema = z.object({
    id: z.string().optional(),
    object: z.string().optional(),
    created: z.number().optional(),
    model: z.string().optional(),
    choices: z.array(
        z.object({
            index: z.number().optional(),
            message: z
                .object({ role: z.string(), content: z.string().nullable().optional() })
                .optional(),
            delta: z
                .object({ content: z.string().optional(), reasoning: z.string().optional() })
                .optional(),
            finish_reason: z.string().optional(),
        }),
    ),
    usage: z
        .object({
            prompt_tokens: z.number().optional(),
            completion_tokens: z.number().optional(),
            total_tokens: z.number().optional(),
        })
        .optional(),
    error: z
        .object({ message: z.string(), type: z.string().optional(), code: z.string().optional() })
        .optional(),
});
