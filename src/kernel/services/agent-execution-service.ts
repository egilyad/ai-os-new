import { getDexieDb } from './database-service';
import type { AgentExecution } from '../types/agems-agent';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentExecution');

export class AgentExecutionService {
    async start(input: Omit<AgentExecution, 'id' | 'startedAt' | 'status'> & { status?: AgentExecution['status'] }): Promise<AgentExecution> {
        const exec: AgentExecution = {
            id: `exec-${crypto.randomUUID()}`,
            status: (input.status as AgentExecution['status']) ?? 'RUNNING',
            triggerType: input.triggerType,
            agentId: input.agentId,
            triggerId: input.triggerId,
            input: input.input,
            startedAt: Date.now(),
        };
        await getDexieDb().agentExecutions.add(exec as never);
        LOGGER.info('AgentExecution', 'started', { id: exec.id, agentId: exec.agentId, trigger: exec.triggerType });
        return exec;
    }

    async complete(id: string, output: Record<string, unknown>, tokens?: number, cost?: number): Promise<void> {
        const db = getDexieDb();
        const existing = await db.agentExecutions.get(id);
        if (!existing) return;
        await db.agentExecutions.update(id, { status: 'COMPLETED', output, tokensUsed: tokens, costUsd: cost, endedAt: Date.now() } as never);
    }

    async fail(id: string, error: string): Promise<void> {
        await getDexieDb().agentExecutions.update(id, { status: 'FAILED', error, endedAt: Date.now() } as never);
    }

    async cancel(id: string): Promise<void> {
        await getDexieDb().agentExecutions.update(id, { status: 'CANCELLED', endedAt: Date.now() } as never);
    }

    async list(agentId: string, limit = 50): Promise<AgentExecution[]> {
        return (await getDexieDb().agentExecutions.where('agentId').equals(agentId).reverse().sortBy('startedAt')).slice(0, limit) as unknown as AgentExecution[];
    }

    async costStats(agentId: string, days = 30): Promise<{ totalCost: number; byProvider: Record<string, number>; count: number }> {
        const since = Date.now() - days * 86400000;
        const rows = (await getDexieDb().agentExecutions.where('agentId').equals(agentId).toArray()) as unknown as AgentExecution[];
        const filtered = rows.filter((r) => r.startedAt >= since && r.costUsd);
        const totalCost = filtered.reduce((s, r) => s + (r.costUsd ?? 0), 0);
        const byProvider: Record<string, number> = {};
        for (const r of filtered) {
            const p = r.provider ?? 'unknown';
            byProvider[p] = (byProvider[p] ?? 0) + (r.costUsd ?? 0);
        }
        return { totalCost, byProvider, count: filtered.length };
    }
}

export const agentExecutionService = new AgentExecutionService();
