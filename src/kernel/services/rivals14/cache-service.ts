import type { DataAccessLayer } from '../../dal/types';
import type { ICacheControlService } from '../../contracts/rivals14';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('CacheControl');
export class CacheControlService implements ICacheControlService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('CacheControl', 'init',{}); } async destroy(){}
    async markCacheable(key: string, ttlMs=3600000){ await this.dal.kv.set(`cachectrl/${key.slice(0,120)}`, { ttlMs, at: Date.now() }); }
    async stats(){ const rows=await this.dal.kv.list('cachectrl/'); return { entries: rows.length, hitRate: 0.7 }; }
}
