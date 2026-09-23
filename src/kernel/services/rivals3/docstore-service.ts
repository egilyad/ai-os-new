/**
 * DocStoreService — H.2 (Flowise-style document stores + feedback, additive).
 *
 * Named stores bind knowledge source ids and optional chat ids (kv).
 * `ask()` scopes retrieval to member sources. Message feedback (thumbs)
 * persists in kv for later eval/hardening.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IDocStoreService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('DocStore');

interface StoreDoc {
    id: string;
    name: string;
    sourceIds: string[];
    chatIds: string[];
    createdAt: number;
}

export class DocStoreService implements IDocStoreService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private knowledge?: IKnowledgeService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('DocStore', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createStore(name: string, sourceIds: string[] = []): Promise<string> {
        const doc: StoreDoc = {
            id: genId('dstore'),
            name: name.slice(0, 160),
            sourceIds: [...sourceIds],
            chatIds: [],
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`docstore/${doc.id}`, doc);
        return doc.id;
    }

    async bindChat(storeId: string, chatId: string): Promise<void> {
        const doc = await this.require(storeId);
        if (!doc.chatIds.includes(chatId)) doc.chatIds.push(chatId);
        await this.dal.kv.set(`docstore/${storeId}`, doc);
    }

    async ask(storeId: string, query: string): Promise<string> {
        const doc = await this.require(storeId);
        if (!this.knowledge) return '(no knowledge backend)';
        const hits = await this.knowledge.retrieve(query, 8);
        const scoped =
            doc.sourceIds.length > 0 ? hits.filter((h) => doc.sourceIds.includes(h.sourceId)) : hits;
        const top = scoped.slice(0, 4);
        if (top.length === 0) return `Store "${doc.name}" has no passages for this query.`;
        return top.map((h, i) => `[${i + 1}] ${h.title}: ${h.chunk.slice(0, 400)}`).join('\n');
    }

    async feedback(messageId: string, vote: 'up' | 'down'): Promise<void> {
        await this.dal.kv.set(`feedback/${messageId}`, { vote, at: Date.now() });
        this.events.emit(EVENTS.DOCSTORE_FEEDBACK, { messageId, vote });
    }

    private async require(id: string): Promise<StoreDoc> {
        const doc = await this.dal.kv.get<StoreDoc>(`docstore/${id}`);
        if (!doc) throw new Error(`Document store not found: ${id}`);
        return doc;
    }
}
