/**
 * CacheRegistryService — P.1 (context-cache manager, additive).
 *
 * Stable prompt prefixes register here with TTL; the stored key is what
 * callers pass as `cachedContent` to the Gemini adapter. Sweep drops
 * expired entries; stats report entries + bytes (hit accounting is
 * provider-side — we track saves and reuse counts).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ICacheRegistryService } from '../../contracts/rivals10';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CacheRegistry');

interface CacheDoc {
    id: string;
    key: string;
    bytes: number;
    reuses: number;
    expiresAt: number;
}

export class CacheRegistryService implements ICacheRegistryService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async create(key: string, content: string, ttlMs = 3600000): Promise<string> {
        const id = genId('ccache');
        const doc: CacheDoc = {
            id,
            key: key.slice(0, 160),
            bytes: content.length,
            reuses: 0,
            expiresAt: Date.now() + Math.max(60000, Math.min(86400000, ttlMs)),
        };
        await this.dal.kv.set(`ccache/${id}`, doc);
        await this.dal.kv.set(`ccache-content/${id}`, content.slice(0, 200000));
        this.events.emit(EVENTS.CACHE_SAVED, { cacheId: id, bytes: doc.bytes });
        return id;
    }

    async get(key: string): Promise<string | null> {
        const rows = await this.dal.kv.list('ccache/');
        const now = Date.now();
        for (const r of rows) {
            if (r.id.startsWith('ccache-content/')) continue;
            const doc = r.value as CacheDoc;
            if (doc.key !== key || doc.expiresAt <= now) continue;
            doc.reuses += 1;
            await this.dal.kv.set(r.id, doc);
            const content = await this.dal.kv.get<string>(`ccache-content/${doc.id}`);
            return typeof content === 'string' ? content : null;
        }
        return null;
    }

    async sweep(): Promise<number> {
        const rows = await this.dal.kv.list('ccache/');
        const now = Date.now();
        let removed = 0;
        for (const r of rows) {
            if (r.id.startsWith('ccache-content/')) continue;
            const doc = r.value as CacheDoc;
            if (doc.expiresAt <= now) {
                await this.dal.kv.delete(r.id);
                await this.dal.kv.delete(`ccache-content/${doc.id}`);
                removed += 1;
            }
        }
        return removed;
    }

    async stats(): Promise<{ entries: number; bytes: number }> {
        const rows = await this.dal.kv.list('ccache/');
        let entries = 0;
        let bytes = 0;
        for (const r of rows) {
            if (r.id.startsWith('ccache-content/')) continue;
            entries += 1;
            bytes += (r.value as CacheDoc).bytes;
        }
        return { entries, bytes };
    }
}
