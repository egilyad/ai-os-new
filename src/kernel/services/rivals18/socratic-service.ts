import type { DataAccessLayer } from '../../dal/types';
import type { ISocraticService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Socratic');
export class SocraticService implements ISocraticService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async ask(question: string){ const q=question.slice(0,300); const list=(await this.dal.kv.get<string[]>('socratic/queue'))??[]; list.push(q); await this.dal.kv.set('socratic/queue', list.slice(-20)); }
      async discuss(topic: string){
          const qs=(await this.dal.kv.get<string[]>('socratic/queue'))??[];
          try{ this.events?.emit(EVENTS.SOCRATIC_DISCUSS, { topic: topic.slice(0,200) }); }catch{}
          return `Socratic seminar on ${topic.slice(0,80)}: ${qs.slice(-3).join(' | ') || 'What is the essence?'}`;
      }
}
