import type { IPolicyDebateService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('PolicyDebate');
export class PolicyDebateService implements IPolicyDebateService {
    constructor(private events?: IEventBus) {}
    async init(){ LOGGER.info('PolicyDebate', 'init',{}); } async destroy(){}
    async run(topic: string, plan: string){
          const advantages=[`Advantage of ${plan.slice(0,40)}: solves ${topic.slice(0,30)}`];
          const disadvantages=[`Disadvantage: cost of ${plan.slice(0,30)}`];
          try{ this.events?.emit(EVENTS.POLICY_ADVANTAGES, { topic: topic.slice(0,200) }); }catch{ /* best-effort */ }
          return { advantages, disadvantages };
    }
}
