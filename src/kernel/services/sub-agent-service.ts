import type { AdapterMessage, ILLMClientService } from '../contracts/provider-adapter';
import { defaultContainer } from '../container';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('SubAgentService');

/** Hard cap on concurrent sub-agent spawns per logical agent (budget guard). */
export const MAX_CONCURRENT_SUB_AGENTS = 16;

export interface SubAgentInput {
    /** The task assigned to the sub-agent. */
    task: string;
    /** Optional system prompt; isolates the sub-agent's context. */
    system?: string;
    /** Logical sub-agent id (used for cache isolation + budget tracking). */
    agentId?: string;
    /** Parent session for provenance/cache scope. */
    sessionId?: string;
    /** Role tag for cache scoping. */
    role?: string;
    /** Explicit model override. */
    model?: string;
    /** Token budget for this call. */
    maxTokens?: number;
    temperature?: number;
}

export interface SubAgentResult {
    executionId: string;
    output: string;
    tokens: number;
    latency: number;
    model?: string;
    startedAt: number;
    endedAt: number;
}

/**
 * P1-1: sub-agent spawn with isolated context and budget.
 *
 * Each spawn runs the LLM with its own cacheScope (agent/session/role) so the
 * sub-agent never contaminates another agent's cache, and a token/concurrency
 * budget that caps resource use. The spawn is recorded with a dedicated
 * executionId (parent/child linkage is the caller's responsibility via the
 * returned executionId).
 */
export class SubAgentService {
    private readonly active = new Map<string, number>();

    get running(): number {
        let total = 0;
        for (const n of this.active.values()) total += n;
        return total;
    }

    async spawn(input: SubAgentInput): Promise<SubAgentResult> {
        const client = defaultContainer.getOptional<ILLMClientService>('llmClientService');
        if (!client) throw new Error('SubAgentService: llmClientService unavailable in container');

        const agentId = input.agentId ?? `sub-${crypto.randomUUID().slice(0, 8)}`;
        // Budget isolation: refuse to exceed the concurrent-spawn budget per agent.
        const running = this.active.get(agentId) ?? 0;
        if (running >= MAX_CONCURRENT_SUB_AGENTS) {
            throw new Error(`Sub-agent budget exceeded for ${agentId}`);
        }
        this.active.set(agentId, running + 1);

        const executionId = `subexec-${crypto.randomUUID()}`;
        const startedAt = Date.now();

        const messages: AdapterMessage[] = [
            {
                role: 'system',
                content: (
                    input.system ??
                    'You are a focused sub-agent working in isolation. Answer the assigned task concisely and cite facts where possible.'
                ).slice(0, 6000),
            },
            { role: 'user', content: input.task.slice(0, 12000) },
        ];

        try {
            const res = await client.chat(messages, {
                model: input.model,
                temperature: input.temperature ?? 0.5,
                maxTokens: input.maxTokens ?? 1024,
                cacheScope: {
                    agentId,
                    sessionId: input.sessionId,
                    role: input.role ?? 'sub-agent',
                },
            });
            if (res.error) throw new Error(`LLM error: ${res.error}`);
            LOGGER.debug('SubAgentService', 'spawn ok', {
                executionId,
                agentId,
                tokens: res.tokens,
            });
            return {
                executionId,
                output: res.content,
                tokens: res.tokens,
                latency: res.latency,
                model: input.model,
                startedAt,
                endedAt: Date.now(),
            };
        } finally {
            const remaining = (this.active.get(agentId) ?? 1) - 1;
            if (remaining <= 0) this.active.delete(agentId);
            else this.active.set(agentId, remaining);
        }
    }
}

export const subAgentService = new SubAgentService();
