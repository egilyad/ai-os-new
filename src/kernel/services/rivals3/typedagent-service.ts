/**
 * TypedAgentService — H.2 (PydanticAI-style deps + validation, additive).
 *
 * Agents declare a system prompt + Zod output schema (Zod is already a
 * project dependency). `runAgent()` injects typed deps into the prompt,
 * validates the JSON output, and retries with the validation error fed back
 * (maxRetries). Every run emits a span event for the Timeline.
 */
import { z } from 'zod';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ITypedAgentService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('TypedAgent');

interface TypedAgent {
    id: string;
    name: string;
    system: string;
    outputSchema: Record<string, unknown>;
    maxRetries: number;
}

function toZod(schema: Record<string, unknown>): z.ZodType<unknown> {
    // Minimal JSON-schema → Zod compiler (object/string/number/boolean/array/enum).
    const build = (node: unknown): z.ZodType<unknown> => {
        if (typeof node !== 'object' || node === null) return z.unknown();
        const n = node as Record<string, unknown>;
        const type = n['type'];
        if (type === 'string') {
            let s: z.ZodType<unknown> = z.string();
            if (Array.isArray(n['enum'])) s = z.enum(n['enum'] as [string, ...string[]]);
            return (n['optional'] as boolean) ? s.optional() : s;
        }
        if (type === 'number' || type === 'integer') {
            const num = z.number();
            return (n['optional'] as boolean) ? num.optional() : num;
        }
        if (type === 'boolean') {
            const b = z.boolean();
            return (n['optional'] as boolean) ? b.optional() : b;
        }
        if (type === 'array') {
            const arr = z.array(build(n['items'] ?? {}));
            return (n['optional'] as boolean) ? arr.optional() : arr;
        }
        if (type === 'object' || n['properties']) {
            const props = n['properties'] as Record<string, unknown> | undefined;
            const shape: Record<string, z.ZodType<unknown>> = {};
            for (const [k, v] of Object.entries(props ?? {})) shape[k] = build(v);
            let obj: z.ZodType<unknown> = z.object(shape);
            const required = n['required'];
            if (obj instanceof z.ZodObject && Array.isArray(required)) {
                const partial: Record<string, z.ZodType<unknown>> = {};
                for (const [k, v] of Object.entries(shape)) {
                    partial[k] = (required as string[]).includes(k) ? v : v.optional();
                }
                obj = z.object(partial);
            }
            return (n['optional'] as boolean) ? obj.optional() : obj;
        }
        return z.unknown();
    };
    return build(schema);
}

export class TypedAgentService implements ITypedAgentService {
    private agents = new Map<string, TypedAgent>();

    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('TypedAgent', 'init', {});
    }

    async destroy(): Promise<void> {
        this.agents.clear();
    }

    async defineAgent(input: {
        name: string;
        system: string;
        outputSchema: Record<string, unknown>;
        maxRetries?: number;
    }): Promise<string> {
        const agent: TypedAgent = {
            id: genId('tagent'),
            name: input.name,
            system: input.system.slice(0, 4000),
            outputSchema: { ...input.outputSchema },
            maxRetries: Math.max(0, Math.min(4, input.maxRetries ?? 2)),
        };
        this.agents.set(agent.id, agent);
        return agent.id;
    }

    async runAgent(agentId: string, task: string, deps: Record<string, unknown> = {}): Promise<unknown> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Typed agent not found: ${agentId}`);
        const schema = toZod(agent.outputSchema);
        const depBlock = Object.keys(deps).length > 0 ? `\nDeps (JSON):\n${JSON.stringify(deps).slice(0, 2000)}` : '';
        let lastError = '';
        for (let attempt = 0; attempt <= agent.maxRetries; attempt++) {
            const raw = await this.ask(
                `${agent.system}${depBlock}\nReply with JSON ONLY matching the schema.`,
                attempt === 0 ? task : `${task}\n\nPrevious output failed validation: ${lastError}. Fix it.`,
            );
            const candidate = this.extractJson(raw);
            const parsed = schema.safeParse(candidate ?? raw);
            if (parsed.success) {
                this.events.emit(EVENTS.TYPED_VALID, { agentId, attempts: attempt + 1 });
                return parsed.data;
            }
            lastError = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ').slice(0, 500);
        }
        throw new Error(`Typed agent ${agent.name} failed validation after ${agent.maxRetries + 1} attempts: ${lastError}`);
    }

    private extractJson(raw: string): unknown {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) return raw;
        try {
            return JSON.parse(raw.slice(start, end + 1)) as unknown;
        } catch {
            return raw;
        }
    }

    private async ask(system: string, user: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: system.slice(0, 4000) },
                        { role: 'user', content: user.slice(0, 6000) },
                    ],
                    { temperature: 0.2, maxTokens: 800, responseFormat: { type: 'json_object' } },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('TypedAgent', 'typed ask failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return '{"echo": true}';
    }
}
