import { getDexieDb } from './dexie-schema';
import type { AgentMetric } from '../types/agems-agent';

export class AgentMetricsService {
    async record(input: Omit<AgentMetric, 'id'>): Promise<number> {
        return (await getDexieDb().agentMetrics.add(input as never)) as unknown as number;
    }

    async list(agentId: string, type?: AgentMetric['metricType']): Promise<AgentMetric[]> {
        let col = getDexieDb().agentMetrics.where('agentId').equals(agentId);
        const rows = (await col.toArray()) as unknown as AgentMetric[];
        return type ? rows.filter((r) => r.metricType === type) : rows;
    }

    async aggregates(agentId: string): Promise<Record<string, { avg: number; sum: number; count: number }>> {
        const rows = await this.list(agentId);
        const map = new Map<string, number[]>();
        for (const r of rows) {
            const arr = map.get(r.metricType) ?? [];
            arr.push(r.value);
            map.set(r.metricType, arr);
        }
        const out: Record<string, { avg: number; sum: number; count: number }> = {};
        for (const [k, vals] of map) {
            const sum = vals.reduce((s, v) => s + v, 0);
            out[k] = { avg: sum / vals.length, sum, count: vals.length };
        }
        return out;
    }
}

export const agentMetricsService = new AgentMetricsService();
