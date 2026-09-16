/**
 * GatewayService — Wave 6.2 (universal entry/exit, additive).
 *
 * Accepts messages on any supported protocol (a2a/mcp/acp/webhook/websocket),
 * normalizes to GatewayEnvelope, translates on demand and re-emits to the
 * internal EventBus. High-churn envelopes stay in memory (ring buffer);
 * governance state lives in InteropRepository.
 */
import type { IEventBus } from '../../types/interfaces';
import type { InteropRepository } from '../../dal/interop-repository';
import type { IGatewayService, InteropProtocol } from '../../contracts/interop';
import type { GatewayEnvelope } from '../../types/interop-types';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { toEnvelope, translateEnvelope } from './translation';

const LOGGER = rootLogger.child('Gateway');

const MAX_BUFFER = 300;

export class GatewayService implements IGatewayService {
    private buffer: GatewayEnvelope[] = [];

    constructor(
        private repo: InteropRepository,
        private events: IEventBus,
    ) {
        void this.repo;
    }

    async init(): Promise<void> {
        LOGGER.info('Gateway', 'init', {});
    }

    async destroy(): Promise<void> {
        this.buffer = [];
    }

    async ingress(input: {
        from: string;
        to: string;
        protocol: InteropProtocol;
        kind?: GatewayEnvelope['kind'];
        payload?: Record<string, unknown>;
    }): Promise<GatewayEnvelope> {
        const envelope = toEnvelope(input);
        this.buffer.push(envelope);
        if (this.buffer.length > MAX_BUFFER) this.buffer.splice(0, this.buffer.length - MAX_BUFFER);
        // Internal projection: every ingress is visible on the EventBus.
        this.events.emit(EVENTS.GATEWAY_INGRESS, {
            envelopeId: envelope.id,
            from: envelope.from,
            protocol: envelope.protocol,
            kind: envelope.kind,
        });
        return envelope;
    }

    async translate(envelope: GatewayEnvelope, target: InteropProtocol): Promise<GatewayEnvelope> {
        const out = translateEnvelope(envelope, target);
        this.buffer.push(out);
        if (this.buffer.length > MAX_BUFFER) this.buffer.splice(0, this.buffer.length - MAX_BUFFER);
        return out;
    }

    async recent(limit = 50): Promise<GatewayEnvelope[]> {
        return this.buffer.slice(-Math.max(1, limit)).reverse();
    }
}
