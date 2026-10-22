/**
 * The assistant's operational eyes: what the system is doing right now.
 *
 * These are read-only observations of runtime state — topology, metrics,
 * traces and pending approvals. They exist so the assistant can answer
 * "почему тормозит", "что сейчас выполняется" and "кого ждёт система"
 * from numbers instead of guessing.
 */
import type { AssistantAction } from '../../contracts/assistant';

/** Structural shapes of the services behind these actions (kept minimal). */
export interface AssistantOpsDeps {
    topology?: {
        summary(): {
            id: string;
            name: string;
            nodes: number;
            agents: number;
            routers: number;
            paused: number;
            edges: number;
        } | null;
    };
    metrics?: {
        aggregated(): {
            totalRequests: number;
            totalTokens: number;
            estimatedCost: number;
            avgLatency: number;
            successRate: number;
            errorRate: number;
            activeProviders: number;
            totalProviders: number;
        };
    };
    traces?: {
        stats(): {
            total: number;
            completed: number;
            failed: number;
            running: number;
            successRate: number;
            avgDuration: number;
            avgTokens: number;
        };
    };
    approvals?: {
        pending(): Array<{ id: string; tool?: string; agentId?: string }>;
    };
}

const pct = (v: number): string => `${Math.round(v * 100)}%`;

export function createAssistantOpsActions(deps: AssistantOpsDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'topology.summary',
        group: 'research',
        description:
            'Summarise the active topology: how many nodes, agents, routers, paused agents and edges it has.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const t = deps.topology?.summary();
            if (!t) return { ok: false, detail: 'no active topology', verification: 'discovered' };
            return {
                ok: true,
                detail: `Topology "${t.name}" (${t.id}): ${t.nodes} nodes, ${t.agents} agents, ${t.routers} routers, ${t.paused} paused, ${t.edges} edges`,
                evidence: `${t.agents} agent(s), ${t.paused} paused, ${t.edges} edge(s)`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'metrics.summary',
        group: 'research',
        description:
            'Read the aggregated runtime metrics: requests, tokens, estimated cost, latency, success and error rates, active providers.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const m = deps.metrics?.aggregated();
            if (!m) return { ok: false, detail: 'metrics are not available', verification: 'discovered' };
            return {
                ok: true,
                detail: `${m.totalRequests} request(s), ${m.totalTokens} tokens, ~$${m.estimatedCost.toFixed(4)}, avg ${Math.round(m.avgLatency)} ms, success ${pct(m.successRate)}, errors ${pct(m.errorRate)}, providers ${m.activeProviders}/${m.totalProviders}`,
                evidence: `requests: ${m.totalRequests} | tokens: ${m.totalTokens} | success: ${pct(m.successRate)}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'traces.summary',
        group: 'research',
        description:
            'Summarise recent execution traces: total, completed, failed, running, success rate, average duration and tokens.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const t = deps.traces?.stats();
            if (!t) return { ok: false, detail: 'traces are not available', verification: 'discovered' };
            return {
                ok: true,
                detail: `${t.total} trace(s): ${t.completed} completed, ${t.failed} failed, ${t.running} running, success ${pct(t.successRate)}, avg ${Math.round(t.avgDuration)} ms`,
                evidence: `total: ${t.total} | failed: ${t.failed} | avgDuration: ${Math.round(t.avgDuration)} ms`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'approvals.pending',
        group: 'research',
        description:
            'List the actions waiting for a human confirmation. Use it when the user asks what the system is waiting for.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const pending = deps.approvals?.pending();
            if (!pending) return { ok: false, detail: 'approvals are not available', verification: 'discovered' };
            if (pending.length === 0) {
                return { ok: true, detail: 'nothing is waiting for confirmation', evidence: 'pending: 0', verification: 'verified' };
            }
            return {
                ok: true,
                detail: `${pending.length} request(s) waiting for confirmation`,
                evidence: pending
                    .map((p) => `${p.id}${p.tool ? ` ${p.tool}` : ''}${p.agentId ? ` (${p.agentId})` : ''}`)
                    .join(' | '),
                verification: 'verified',
            };
        },
    });

    return actions;
}
