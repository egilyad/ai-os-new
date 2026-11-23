import { z } from 'zod';

export const providersPayloadSchema = z.array(
    z
        .object({
            provider: z.string(),
            label: z.string(),
        })
        .passthrough(),
);

export const memoryPayloadSchema = z.array(
    z
        .object({
            id: z.string(),
            content: z.string(),
            vector: z.array(z.number()).optional(),
            metadata: z
                .object({
                    source: z.union([z.string(), z.number()]),
                    type: z.string(),
                    timestamp: z.number(),
                    importance: z.number(),
                })
                .passthrough(),
            score: z.number().optional(),
            embedding: z.array(z.number()).optional(),
        })
        .passthrough(),
);
