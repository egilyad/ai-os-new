import type { DataAccessLayer } from '../../dal/types';
import type { IFishbowlService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Fishbowl');
export class FishbowlService implements IFishbowlService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async setBowl(members: string[]){ await this.dal.kv.set('fishbowl/bowl', members.slice(0,4).map(m=>m.slice(0,40))); }
      async rotate(newMember: string){
          const bowl=(await this.dal.kv.get<string[]>('fishbowl/bowl'))??[];
          if(bowl.length>=4) bowl.shift();
          bowl.push(newMember.slice(0,40));
          await this.dal.kv.set('fishbowl/bowl', bowl);
          try{ this.events?.emit(EVENTS.FISHBOWL_ROTATE, { topic: newMember.slice(0,80) }); }catch{}
          return [...bowl];
      }
}
