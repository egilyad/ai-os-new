import type { Connector } from '../types/domain-types';
import type { IDatabaseService } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ConnectorService');
const TEST_TIMEOUT = 10000;
const WEBHOOK_PREFIX = 'hook-';

export interface ConnectorServiceDeps {
    database: IDatabaseService;
}

export class ConnectorService {
    private deps: ConnectorServiceDeps;

    constructor(deps: ConnectorServiceDeps) {
        this.deps = deps;
    }

    destroy(): void {}

    async getAll(): Promise<Connector[]> {
        try {
            return (await this.deps.database.getAllConnectors()) as Connector[];
        } catch (e) {
            LOGGER.warn('getAll', 'Failed to load connectors', { error: String(e) });
            return [];
        }
    }

    async saveAll(connectors: Connector[]): Promise<void> {
        try {
            await this.deps.database.bulkPutConnectors(connectors);
        } catch (e) {
            LOGGER.warn('saveAll', 'Failed to save connectors', { error: String(e) });
        }
    }

    async testConnection(
        endpoint: string,
    ): Promise<{ ok: boolean; latency: number; error?: string }> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT);
        const start = performance.now();
        try {
            const res = await fetch(endpoint, {
                method: 'HEAD',
                signal: controller.signal,
            });
            clearTimeout(timer);
            const latency = Math.round(performance.now() - start);
            if (res.ok) {
                res.body?.cancel()?.catch(() => {});
                return { ok: true, latency };
            }
            res.body?.cancel()?.catch(() => {});
            return { ok: false, latency, error: `HTTP ${res.status}: ${res.statusText}` };
        } catch (e) {
            clearTimeout(timer);
            const msg = e instanceof Error ? e.message : String(e);
            const latency = Math.round(performance.now() - start);
            return { ok: false, latency, error: msg };
        }
    }

    async connect(connector: Connector, endpoint?: string): Promise<Connector> {
        let status: Connector['status'] = 'connected';
        if (endpoint) {
            const result = await this.testConnection(endpoint);
            status = result.ok ? 'connected' : 'auth_required';
            LOGGER.info('connect', `Tested ${connector.id} at ${endpoint}: ${status}`, {
                latency: result.latency,
                error: result.error,
            });
        }
        connector = {
            ...connector,
            status,
            lastSync: status === 'connected' ? 'Just now' : undefined,
            endpoint,
            lastTested: endpoint ? Date.now() : undefined,
        };
        return connector;
    }

    generateWebhookUrl(base: string): string {
        const id = `${WEBHOOK_PREFIX}${crypto.randomUUID().slice(0, 12)}`;
        return `${base.replace(/\/+$/, '')}/webhooks/${id}`;
    }
}
