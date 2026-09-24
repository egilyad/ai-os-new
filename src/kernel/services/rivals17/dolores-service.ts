import type { DataAccessLayer } from '../../dal/types';
import type { IDoloresService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('DOLORES');
export class DoloresService implements IDoloresService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('DOLORES', 'init',{}); } async destroy(){}
    async scaffold(steps: Array<{ do: string; pre?: string; post?: string }>){
          const id=`dolores-${Date.now()}`;
          await this.dal.kv.set(`dolores/${id}`, { steps: steps.slice(0,10), trace: [] as string[] });
          try{ this.events?.emit(EVENTS.DOLORES_TRACE, { id }); }catch{ /* best-effort */ }
          return id;
      }
      async trace(){
          const rows=await this.dal.kv.list('dolores/');
          const res = rows.map(r=>r.id).slice(0,10);
          try{ if(res.length) this.events?.emit(EVENTS.DOLORES_TRACE, { id: res[0]! }); }catch{ /* best-effort */ }
          return res;
      }
}
