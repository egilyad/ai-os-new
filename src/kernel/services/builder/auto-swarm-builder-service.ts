/**
 * AutoSwarmBuilder (Swarms / CAMEL RoleAssignment inspiration).
 *
 * Turns a natural-language request into a typed team spec (agents + prompts +
 * topology) via the injected LLM. Output is validated with Zod; on failure
 * the last error is returned instead of throwing. The result can be loaded
 * directly into the visual pipeline constructor.
 */
import { z } from 'zod';
import type { IAutoSwarmBuilderService, BuiltSwarmSpec } from '../../contracts/auto-swarm-builder';

export const BUILT_SWARM_SCHEMA = z.object({
    name: z.string().min(1),
    goal: z.string().min(1),
    agents: z
        .array(
            z.object({
                id: z.string().min(1),
                role: z.string().min(1),
                prompt: z.string().min(10),
                model: z.string().optional(),
            }),
        )
        .min(1)
        .max(12),
    topology: z.enum(['sequential', 'parallel', 'hierarchical', 'debate']),
});

export class AutoSwarmBuilderService implements IAutoSwarmBuilderService {
    constructor(
        private llm: {
            chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
        },
    ) {}

    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    schema() {
        return BUILT_SWARM_SCHEMA;
    }

    async build(
        request: string,
    ): Promise<{ ok: true; spec: BuiltSwarmSpec } | { ok: false; error: string }> {
        if (!request.trim()) return { ok: false, error: 'request is empty' };
        try {
            const res = await this.llm.chat([
                {
                    role: 'system',
                    content:
                        'Design a team of AI agents for the given task. Reply ONLY with JSON: ' +
                        '{"name","goal","agents":[{"id","role","prompt","model?"}],' +
                        '"topology":"sequential|parallel|hierarchical|debate"}. ' +
                        'Each prompt must be a concrete instruction (10+ chars).',
                },
                { role: 'user', content: request.slice(0, 2000) },
            ]);
            const start = res.content.indexOf('{');
            const end = res.content.lastIndexOf('}');
            if (start < 0 || end <= start)
                return { ok: false, error: 'LLM response has no JSON object' };
            const parsed = BUILT_SWARM_SCHEMA.safeParse(
                JSON.parse(res.content.slice(start, end + 1)),
            );
            if (!parsed.success) return { ok: false, error: parsed.error.message };
            return { ok: true, spec: parsed.data };
        } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
    }
}
