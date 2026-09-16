/**
 * SupportService — K.3 (Intercom-style inbox, additive).
 *
 * Tickets in DAL kv with message threads, canned macros, bot drafts via
 * RagService (LLM answers grounded in knowledge), human handoff through
 * mobile notifications, and a resolution-rate stat.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IRagService } from '../../contracts/rivals2';
import type { IMobileAccessService } from '../../contracts/ops';
import type { ISupportService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Support');

interface TicketDoc {
    id: string;
    subject: string;
    status: 'open' | 'pending' | 'resolved';
    team?: string;
    messages: Array<{ by: string; text: string; at: number }>;
    createdAt: number;
}

export class SupportService implements ISupportService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private rag?: IRagService,
        private inbox?: IMobileAccessService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async openTicket(subject: string, message: string): Promise<string> {
        const doc: TicketDoc = {
            id: genId('ticket'),
            subject: subject.slice(0, 200),
            status: 'open',
            messages: [{ by: 'customer', text: message.slice(0, 2000), at: Date.now() }],
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`tickets/${doc.id}`, doc);
        this.events.emit(EVENTS.SUPPORT_OPEN, { ticketId: doc.id });
        return doc.id;
    }

    async reply(ticketId: string, text: string, by = 'agent'): Promise<void> {
        const doc = await this.require(ticketId);
        doc.messages.push({ by, text: text.slice(0, 2000), at: Date.now() });
        if (by !== 'customer' && doc.status === 'open') doc.status = 'pending';
        if (by === 'customer' && doc.status === 'pending') doc.status = 'open';
        await this.dal.kv.set(`tickets/${ticketId}`, doc);
    }

    async defineMacro(name: string, text: string): Promise<void> {
        await this.dal.kv.set(`macros/${name.slice(0, 80)}`, text.slice(0, 2000));
    }

    async applyMacro(ticketId: string, macro: string): Promise<void> {
        const text = await this.dal.kv.get<string>(`macros/${macro}`);
        if (typeof text !== 'string') throw new Error(`Macro not found: ${macro}`);
        await this.reply(ticketId, text, 'agent');
    }

    async botDraft(ticketId: string): Promise<string> {
        const doc = await this.require(ticketId);
        const last = [...doc.messages].reverse().find((m) => m.by === 'customer');
        const question = last?.text ?? doc.subject;
        if (!this.rag) return `(no RAG backend) Draft for: ${question.slice(0, 200)}`;
        const res = await this.rag.answer(question, 0);
        const draft = `Suggested draft (citations: ${res.citations.join(', ') || 'none'}):\n${res.answer}`.slice(0, 3000);
        doc.messages.push({ by: 'bot-draft', text: draft, at: Date.now() });
        await this.dal.kv.set(`tickets/${ticketId}`, doc);
        return draft;
    }

    async handoff(ticketId: string, team = 'humans'): Promise<void> {
        const doc = await this.require(ticketId);
        doc.status = 'pending';
        doc.team = team;
        await this.dal.kv.set(`tickets/${ticketId}`, doc);
        if (this.inbox) {
            try {
                await this.inbox.notify({
                    title: `Support handoff: ${doc.subject}`,
                    body: `Ticket ${ticketId} → ${team}`,
                    actionRef: `ticket:${ticketId}`,
                });
            } catch {
                // inbox best-effort
            }
        }
        this.events.emit(EVENTS.SUPPORT_HANDOFF, { ticketId, team });
    }

    async resolutionRate(): Promise<number> {
        const rows = await this.dal.kv.list('tickets/');
        if (rows.length === 0) return 0;
        const resolved = rows.filter(
            (r) => (r.value as TicketDoc).messages.some((m) => m.by !== 'customer' && m.by !== 'bot-draft'),
        ).length;
        return Math.round((resolved / rows.length) * 100) / 100;
    }

    private async require(id: string): Promise<TicketDoc> {
        const doc = await this.dal.kv.get<TicketDoc>(`tickets/${id}`);
        if (!doc) throw new Error(`Ticket not found: ${id}`);
        return doc;
    }
}
