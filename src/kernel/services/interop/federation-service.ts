/**
 * FederationService — Wave 6.4 (fleet of OS instances, trust-gated).
 *
 * Peers are other SuperAgents OS instances (local + LAN + server). Dispatch
 * goes through IInteropTransport when present, otherwise loopback-records the
 * handoff (offline-first). Untrusted peers are never auto-dispatched.
 */
import type { IEventBus } from '../../types/interfaces';
import type { InteropRepository } from '../../dal/interop-repository';
import type { IFederationService, IInteropTransport, TrustLevel } from '../../contracts/interop';
import type { FederationPeer, HandoffRecord } from '../../types/interop-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { toEnvelope } from './translation';

const LOGGER = rootLogger.child('Federation');

function now(): number {
    return Date.now();
}

export class FederationService implements IFederationService {
    constructor(
        private repo: InteropRepository,
        private events: IEventBus,
        private transport?: IInteropTransport,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', { loopback: !this.transport });
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async addPeer(input: {
        name: string;
        baseUrl: string;
        trust?: TrustLevel;
        capabilities?: string[];
    }): Promise<FederationPeer> {
        const t = now();
        const peer: FederationPeer = {
            id: genId('peer'),
            name: input.name,
            baseUrl: input.baseUrl,
            trust: input.trust ?? 'known',
            capabilities: input.capabilities ?? [],
            createdAt: t,
        };
        await this.repo.putPeer(peer);
        this.events.emit(EVENTS.FED_PEER, { peerId: peer.id, action: 'added', trust: peer.trust });
        return peer;
    }

    async removePeer(id: string): Promise<void> {
        await this.repo.deletePeer(id);
        this.events.emit(EVENTS.FED_PEER, { peerId: id, action: 'removed', trust: '' });
    }

    async listPeers(): Promise<FederationPeer[]> {
        return this.repo.listPeers();
    }

    async heartbeat(id: string): Promise<FederationPeer> {
        const peer = await this.require(id);
        peer.lastHeartbeatAt = now();
        await this.repo.putPeer(peer);
        return peer;
    }

    async dispatch(peerId: string, task: string, payload: Record<string, unknown> = {}): Promise<HandoffRecord> {
        const peer = await this.require(peerId);
        if (peer.trust === 'untrusted') throw new Error(`Peer ${peer.name} is untrusted — dispatch refused`);
        const t = now();
        const envelope = toEnvelope({ from: 'local-os', to: peer.id, protocol: 'a2a', kind: 'task', payload: { task, ...payload } });
        let status: HandoffRecord['status'] = 'dispatched';
        let result: string | undefined;
        if (this.transport) {
            try {
                const res = await this.transport.send(peer, envelope);
                status = 'returned';
                result = JSON.stringify(res).slice(0, 4000);
            } catch (e) {
                status = 'failed';
                result = e instanceof Error ? e.message : String(e);
            }
        }
        const record: HandoffRecord = {
            id: genId('handoff'),
            target: `fed:${peer.id}`,
            task,
            context: { ...payload, baseUrl: peer.baseUrl, traceId: envelope.id },
            status,
            result,
            traceId: envelope.id,
            createdAt: t,
            updatedAt: now(),
        };
        await this.repo.putHandoff(record);
        this.events.emit(EVENTS.HANDOFF_DISPATCHED, { handoffId: record.id, target: record.target });
        return record;
    }

    async fleetView(): Promise<{ peers: FederationPeer[]; totalCapabilities: string[] }> {
        const peers = await this.repo.listPeers();
        const caps = new Set<string>();
        for (const p of peers) for (const c of p.capabilities) caps.add(c);
        return { peers, totalCapabilities: [...caps].sort() };
    }

    private async require(id: string): Promise<FederationPeer> {
        const p = await this.repo.getPeer(id);
        if (!p) throw new Error(`Federation peer not found: ${id}`);
        return p;
    }
}
