import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('N8N');

export interface N8NWorkflow {
    id: string;
    url: string;
    apiKey?: string;
}

/**
 * Minimal N8N trigger — per-agent RuntimeConfig.n8nApiUrl/n8nApiKey.
 * Triggers workflow via POST to {url}/api/v1/workflows/{id}/execute
 */
export class N8NService {
    async trigger(agentId: string, workflowId: string, payload: Record<string, unknown>): Promise<unknown> {
        const cfg = await this.resolveConfig(agentId);
        if (!cfg.url) throw new Error(`No N8N URL for agent ${agentId}`);
        const endpoint = `${cfg.url.replace(/\/$/, '')}/api/v1/workflows/${workflowId}/execute`;
        LOGGER.info('N8N', 'trigger', { agentId, workflowId });
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(cfg.apiKey ? { 'X-N8N-API-KEY': cfg.apiKey } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`N8N ${res.status}: ${await res.text()}`);
            return await res.json();
        } catch (e) {
            LOGGER.warn('N8N', 'trigger failed', { error: e instanceof Error ? e.message : String(e) });
            throw e;
        }
    }

    private async resolveConfig(agentId: string): Promise<{ url?: string; apiKey?: string }> {
        try {
            const { getDexieDb } = await import('./dexie-schema');
            const rows = (await getDexieDb().agentMemory.where('agentId').equals(agentId).toArray()) as Array<{ content: string }>;
            for (let i = rows.length - 1; i >= 0; i--) {
                try {
                    const obj = JSON.parse(rows[i]!.content) as { kind?: string; n8nApiUrl?: string; n8nApiKey?: string };
                    if (obj.kind === 'n8n' || obj.n8nApiUrl) return { url: obj.n8nApiUrl, apiKey: obj.n8nApiKey };
                } catch {}
            }
        } catch {}
        return {};
    }

    async setConfig(agentId: string, url: string, apiKey?: string): Promise<void> {
        const { getDexieDb } = await import('./dexie-schema');
        await getDexieDb().agentMemory.add({
            agentId,
            type: 'KNOWLEDGE',
            content: JSON.stringify({ kind: 'n8n', n8nApiUrl: url, n8nApiKey: apiKey }),
            createdAt: Date.now(),
        } as never);
    }
}

export const n8nService = new N8NService();
