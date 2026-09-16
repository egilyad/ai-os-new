import { z } from 'zod';

export const OpenAiCompatibleResponseSchema = z.object({
  id: z.string().optional(),
  object: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  choices: z.array(z.object({
    index: z.number().optional(),
    message: z.object({
      role: z.string().optional(),
      content: z.string().nullable().optional(),
      tool_calls: z.array(z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        function: z.object({
          name: z.string().optional(),
          arguments: z.string().optional(),
        }).optional(),
      })).optional(),
    }).optional(),
    delta: z.object({ content: z.string().optional() }).optional(),
    finish_reason: z.string().optional(),
  })).optional(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
  error: z.object({ message: z.string(), type: z.string() }).optional(),
});
