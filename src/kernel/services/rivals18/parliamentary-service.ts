import type { DataAccessLayer } from '../../dal/types';
import type { IParliamentaryService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Parliament');
export class ParliamentaryService implements IParliamentaryService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Parliament', 'init',{}); } async destroy(){}
    async run(topic: string){
        const teams=['OG','OO','CG','CO'];
        const ranking=[...teams].sort(()=>Math.random()-0.5);
        const pois=Math.floor(Math.random()*5);
          await this.dal.kv.set(`parliament/${Date.now()}`, { topic: topic.slice(0,100), ranking, pois });
          try{ this.events?.emit(EVENTS.PARLIAMENTARY_RUN, { topic: topic.slice(0,200) }); }catch{}
          return { ranking, pois };
    }
}
