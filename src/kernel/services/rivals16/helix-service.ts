import type { DataAccessLayer } from '../../dal/types';
import type { IHelixService } from '../../contracts/rivals16';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Helix');
export class HelixService implements IHelixService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Helix', 'init',{}); } async destroy(){}
    async addOnto(term: string, rel: string){ await this.dal.kv.set(`helix-onto/${term}/${rel}`, { at: Date.now() }); }
    async gaps(){
        const rows=await this.dal.kv.list('helix-onto/');
        const res = rows.length<2 ? ['gap: sparse ontology — need more terms'] : rows.slice(0,5).map(r=>`gap near ${r.id}`);
        try{ this.events?.emit(EVENTS.HELIX_GAPS, { count: res.length }); }catch{}
        return res;
    }
}
