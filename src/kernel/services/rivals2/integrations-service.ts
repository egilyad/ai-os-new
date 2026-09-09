/**
 * IntegrationsService — G.3 (Composio-style catalog, additive).
 *
 * Static catalog of ~20 apps (auth kind + actions + triggers); connections
 * persist in DAL kv (`conn/*`, auth REFERENCE NAME only — never secrets,
 * same rule as credential_ref). `fireTrigger()` emits a gateway envelope so
 * triggers flow into crews/graphs like any other event.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IGatewayService } from '../../contracts/interop';
import type { IIntegrationsService } from '../../contracts/rivals2';
import type { Connection, IntegrationApp } from '../../types/rival2-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Integrations');

function now(): number {
    return Date.now();
}

export const APP_CATALOG: IntegrationApp[] = [
    { name: 'gmail', auth: 'oauth', actions: ['search', 'send', 'label'], triggers: ['message.received'] },
    { name: 'slack', auth: 'oauth', actions: ['post', 'search', 'react'], triggers: ['message.posted'] },
    { name: 'github', auth: 'oauth', actions: ['issue.create', 'pr.open', 'search'], triggers: ['pr.opened', 'issue.opened'] },
    { name: 'salesforce', auth: 'oauth', actions: ['record.get', 'record.update'], triggers: ['record.changed'] },
    { name: 'notion', auth: 'oauth', actions: ['page.create', 'db.query'], triggers: [] },
    { name: 'linear', auth: 'api_key', actions: ['issue.create', 'issue.list'], triggers: ['issue.created'] },
    { name: 'jira', auth: 'oauth', actions: ['issue.create', 'issue.transition'], triggers: ['issue.updated'] },
    { name: 'drive', auth: 'oauth', actions: ['file.read', 'file.list'], triggers: ['file.created'] },
    { name: 'calendar', auth: 'oauth', actions: ['event.create', 'event.list'], triggers: ['event.starting'] },
    { name: 'stripe', auth: 'api_key', actions: ['payment.get', 'customer.get'], triggers: ['payment.succeeded'] },
    { name: 'postgres', auth: 'api_key', actions: ['query'], triggers: [] },
    { name: 'webhook-in', auth: 'none', actions: [], triggers: ['http.received'] },
    { name: 'telegram', auth: 'api_key', actions: ['send'], triggers: ['message.received'] },
    { name: 'discord', auth: 'api_key', actions: ['send'], triggers: ['message.posted'] },
    { name: 'openai', auth: 'api_key', actions: ['chat', 'embed'], triggers: [] },
    { name: 'anthropic', auth: 'api_key', actions: ['chat'], triggers: [] },
    { name: 'serper', auth: 'api_key', actions: ['search'], triggers: [] },
    { name: 'browserbase', auth: 'api_key', actions: ['load', 'screenshot'], triggers: [] },
    { name: 's3', auth: 'api_key', actions: ['get', 'put', 'list'], triggers: [] },
    { name: 'scheduler', auth: 'none', actions: [], triggers: ['cron.fired'] },
];

export class IntegrationsService implements IIntegrationsService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private gateway?: IGatewayService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', { apps: APP_CATALOG.length });
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async catalog(): Promise<IntegrationApp[]> {
        return APP_CATALOG.map((a) => ({ ...a, actions: [...a.actions], triggers: [...a.triggers] }));
    }

    async connect(app: string, label: string, authRef?: string): Promise<Connection> {
        const known = APP_CATALOG.find((a) => a.name === app);
        if (!known) throw new Error(`Unknown app: ${app}`);
        if (known.auth !== 'none' && !authRef) {
            throw new Error(`App ${app} needs an auth reference (name only, never a secret)`);
        }
        if (authRef && /(sk-|password\s*[:=]|bearer\s+[a-z0-9])/i.test(authRef)) {
            throw new Error('authRef must be a reference name — never paste a secret');
        }
        const conn: Connection = {
            id: genId('conn'),
            app,
            label: label.slice(0, 120),
            authRef,
            createdAt: now(),
        };
        await this.dal.kv.set<Connection>(`conn/${conn.id}`, conn);
        return conn;
    }

    async listConnections(): Promise<Connection[]> {
        const rows = await this.dal.kv.list('conn/');
        return rows.map((r) => r.value as Connection);
    }

    async disconnect(id: string): Promise<void> {
        await this.dal.kv.delete(`conn/${id}`);
    }

    async fireTrigger(app: string, trigger: string, payload: Record<string, unknown> = {}): Promise<string> {
        const known = APP_CATALOG.find((a) => a.name === app);
        if (!known) throw new Error(`Unknown app: ${app}`);
        if (!known.triggers.includes(trigger)) {
            throw new Error(`App ${app} has no trigger ${trigger}`);
        }
        const id = genId('trig');
        if (this.gateway) {
            await this.gateway.ingress({
                from: `integration:${app}`,
                to: 'local-os',
                protocol: 'webhook',
                kind: 'task',
                payload: { trigger, ...payload, triggerId: id },
            });
        }
        this.events.emit(EVENTS.INTEGRATION_TRIGGER, { app, trigger, triggerId: id });
        return id;
    }
}
