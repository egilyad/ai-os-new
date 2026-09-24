import type { DataAccessLayer } from '../../dal/types';
import type { ICacheControlService } from '../../contracts/rivals14';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('CacheControl');
export class CacheControlService implements ICacheControlService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){         LOGGER.info('CacheControl', 'init',{}); } async destroy(){}
    async markCacheable(key: string, ttlMs=3600000){
        const cleanKey = key.slice(0, 120);
        await this.dal.kv.set(`cachectrl/${cleanKey}`, { ttlMs, at: Date.now() });
        try { this.events?.emit(EVENTS.CACHE_CONTROL_MARKED, { key: cleanKey, ttlMs }); } catch { /* best-effort */ }
    }
    async stats(){
        const rows = await this.dal.kv.list('cachectrl/');
        const now = Date.now();
        let fresh = 0;
        for (const row of rows) {
            const v = row.value as { ttlMs?: number; at?: number } | null;
            if (!v || typeof v.ttlMs !== 'number' || typeof v.at !== 'number') continue;
            if (v.at + v.ttlMs > now) fresh++;
        }
        const entries = rows.length;
        // Real hitRate: fraction of entries still within TTL (fresh). 0 if empty.
        const hitRate = entries === 0 ? 0 : fresh / entries;
        const result = { entries, hitRate: Math.round(hitRate * 100) / 100 };
        try { this.events?.emit(EVENTS.CACHE_CONTROL_STATS, result); } catch { /* best-effort */ }
        return result;
    }
}
