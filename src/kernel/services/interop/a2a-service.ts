/**
 * A2AService — Wave 6.1 (Google A2A-style, offline-first).
 *
 * Discovery + capability advertisement + negotiation + handoff + error
 * contracts. Transport is loopback by default (records handoff, deterministic
 * negotiation); IInteropTransport injection enables real HTTP later.
 */
import type { IEventBus } from '../../types/interfaces';
import type { InteropRepository } from '../../dal/interop-repository';
import type { IA2AService, IInteropTransport, InteropProtocol, TrustLevel } from '../../contracts/interop';
import type { A2AAgent, HandoffRecord } from '../../types/interop-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { a2aError } from './translation';

const LOGGER = rootLogger.child('A2A');

function now(): number {
    return Date.now();
}

export class A2AService implements IA2AService {
    constructor(
        private repo: InteropRepository,
        private events: IEventBus,
        private transport?: IInteropTransport,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('A2A', 'init', { loopback: !this.transport });
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async advertise(input: {
        name: string;
        endpoint: string;
        protocols?: InteropProtocol[];
        capabilities?: string[];
        streaming?: boolean;
        trust?: TrustLevel;
    }): Promise<A2AAgent> {
        const t = now();
        const agent: A2AAgent = {
            id: genId('a2a'),
            name: input.name,
            endpoint: input.endpoint,
            protocols: input.protocols ?? ['a2a'],
            capabilities: input.capabilities ?? [],
            streaming: input.streaming ?? false,
            trust: input.trust ?? 'known',
            lastSeenAt: t,
            createdAt: t,
        };
        await this.repo.putAgent(agent);
        this.events.emit(EVENTS.INTEROP_AGENT, { agentId: agent.id, action: 'advertised' });
        return agent;
    }

    async discover(filter: { capability?: string; protocol?: InteropProtocol } = {}): Promise<A2AAgent[]> {
        const all = await this.repo.listAgents();
        return all.filter(
            (a) =>
                (!filter.capability || a.capabilities.includes(filter.capability)) &&
                (!filter.protocol || a.protocols.includes(filter.protocol)),
        );
    }

    async negotiate(agentId: string, task: string): Promise<{ accepted: boolean; note: string }> {
        const agent = await this.require(agentId);
        // Deterministic policy: untrusted agents never auto-accept; others accept
        // when at least one capability token overlaps the task (else explicit refuse).
        if (agent.trust === 'untrusted') {
            return { accepted: false, note: 'Untrusted agent requires manual approval' };
        }
        const taskTokens = new Set(task.toLowerCase().split(/[^a-zа-яё0-9]+/u));
        const overlap = agent.capabilities.some((c) =>
            c.toLowerCase().split(/[^a-zа-яё0-9]+/u).some((t) => taskTokens.has(t)),
        );
        const accepted = agent.capabilities.length === 0 || overlap;
        this.events.emit(EVENTS.INTEROP_NEGOTIATED, { agentId, accepted });
        return {
            accepted,
            note: accepted ? `Accepted by ${agent.name}` : 'No capability overlap — refused',
        };
    }

    async handoff(agentId: string, task: string, context: Record<string, unknown> = {}): Promise<HandoffRecord> {
        const agent = await this.require(agentId);
        const t = now();
        const record: HandoffRecord = {
            id: genId('handoff'),
            target: agentId,
            task,
            context: { ...context, endpoint: agent.endpoint },
            status: 'dispatched',
            traceId: genId('trace'),
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putHandoff(record);
        this.events.emit(EVENTS.HANDOFF_DISPATCHED, { handoffId: record.id, target: agentId });
        return record;
    }

    async reportError(agentId: string, code: string, message: string): Promise<void> {
        await this.require(agentId);
        this.events.emit(EVENTS.INTEROP_ERROR, {
            agentId,
            error: a2aError(code, message) as { code?: string },
        });
        LOGGER.warn('A2A', 'a2a peer error', { agentId, code });
    }

    private async require(id: string): Promise<A2AAgent> {
        const a = await this.repo.getAgent(id);
        if (!a) throw new Error(`A2A agent not found: ${id}`);
        return a;
    }
}
