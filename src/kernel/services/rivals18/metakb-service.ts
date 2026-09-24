import type { DataAccessLayer } from '../../dal/types';
import type { IMetaKbService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('MetaKb');
export class MetaKbService implements IMetaKbService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('MetaKb', 'init',{}); } async destroy(){}
    async put(entry: string, text: string){ await this.dal.kv.set(`metakb/${entry.slice(0,80)}`, text.slice(0,2000)); }
      async query(q: string){
          const rows=await this.dal.kv.list('metakb/');
          const scored=rows.map(r=>{ const t=r.value as string; const score=t.toLowerCase().split(q.toLowerCase().slice(0,20)).length; return { id: r.id, score, text: t }; }).sort((a,b)=>b.score-a.score).slice(0,3);
          try{ this.events?.emit(EVENTS.METAKB_QUERY, { query: q.slice(0,200) }); }catch{ /* best-effort */ }
          return scored.map(s=>s.text.slice(0,300));
    }
}
