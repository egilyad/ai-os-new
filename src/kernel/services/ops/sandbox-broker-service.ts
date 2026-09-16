/**
 * SandboxBrokerService — Wave 5.2 (Browser/Computer Use via safe tickets).
 *
 * E2B-pattern handoff: agents REQUEST a ticket, a human/policy APPROVES it,
 * execution (future E2B/browser-use wiring) consumes the ticket id. TTL +
 * explicit lifecycle prevent stray automation. No real sandbox here.
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService, ISandboxBrokerService, SandboxKind } from '../../contracts/ops';
import type { SandboxTicket } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SandboxBroker');

function now(): number {
    return Date.now();
}

export class SandboxBrokerService implements ISandboxBrokerService {
    constructor(
        private repo: OpsRepository,
        private events: IEventBus,
        private audit: IAuditService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async request(input: {
        kind: SandboxKind;
        agentId: string;
        purpose: string;
        ttlMs?: number;
    }): Promise<SandboxTicket> {
        const t = now();
        const ticket: SandboxTicket = {
            id: genId('sbx'),
            kind: input.kind,
            agentId: input.agentId,
            purpose: input.purpose.slice(0, 500),
            status: 'requested',
            ttlMs: input.ttlMs ?? 10 * 60 * 1000,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putTicket(ticket);
        await this.audit.append('sandbox', 'ticket.requested', ticket.id, `${ticket.kind} ${ticket.purpose}`.slice(0, 500));
        this.events.emit(EVENTS.OPS_SANDBOX, { ticketId: ticket.id, status: 'requested' });
        return ticket;
    }

    async approve(id: string): Promise<SandboxTicket> {
        return this.transition(id, 'approved', 'ticket.approved');
    }

    async deny(id: string, reason = ''): Promise<SandboxTicket> {
        const t = await this.require(id);
        if (t.status !== 'requested') throw new Error(`Ticket ${id} is ${t.status}`);
        t.status = 'denied';
        t.updatedAt = now();
        await this.repo.putTicket(t);
        await this.audit.append('sandbox', 'ticket.denied', id, reason.slice(0, 500));
        this.events.emit(EVENTS.OPS_SANDBOX, { ticketId: id, status: 'denied' });
        return t;
    }

    async markRunning(id: string): Promise<SandboxTicket> {
        const t = await this.require(id);
        if (t.status !== 'approved') throw new Error(`Ticket ${id} is ${t.status} (needs approved)`);
        if (now() - t.createdAt > t.ttlMs) {
            t.status = 'expired';
            t.updatedAt = now();
            await this.repo.putTicket(t);
            throw new Error(`Ticket ${id} expired`);
        }
        t.status = 'running';
        t.updatedAt = now();
        await this.repo.putTicket(t);
        return t;
    }

    async complete(id: string): Promise<SandboxTicket> {
        return this.transition(id, 'done', 'ticket.completed', ['running', 'approved']);
    }

    async get(id: string): Promise<SandboxTicket | null> {
        return this.repo.getTicket(id);
    }

    async list(): Promise<SandboxTicket[]> {
        return this.repo.listTickets();
    }

    private async transition(
        id: string,
        to: SandboxTicket['status'],
        auditAction: string,
        allowedFrom: Array<SandboxTicket['status']> = ['requested'],
    ): Promise<SandboxTicket> {
        const t = await this.require(id);
        if (!allowedFrom.includes(t.status)) throw new Error(`Ticket ${id} is ${t.status}`);
        t.status = to;
        t.updatedAt = now();
        await this.repo.putTicket(t);
        await this.audit.append('sandbox', auditAction, id, '');
        this.events.emit(EVENTS.OPS_SANDBOX, { ticketId: id, status: to });
        return t;
    }

    private async require(id: string): Promise<SandboxTicket> {
        const t = await this.repo.getTicket(id);
        if (!t) throw new Error(`Sandbox ticket not found: ${id}`);
        return t;
    }
}
