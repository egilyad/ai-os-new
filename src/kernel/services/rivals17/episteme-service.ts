import type { DataAccessLayer } from '../../dal/types';
import type { IEpistemeService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Episteme');
export class EpistemeService implements IEpistemeService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Episteme', 'init',{}); } async destroy(){}
    async sync(agentState: string, humanState: string){
        const synced=agentState.slice(0,100)===humanState.slice(0,100) || agentState.includes(humanState.slice(0,20));
        const showWork=`Agent: ${agentState.slice(0,200)} | Human: ${humanState.slice(0,200)} | synced=${synced}`;
          await this.dal.kv.set(`episteme/${Date.now()}`, { agentState: agentState.slice(0,300), humanState: humanState.slice(0,300), synced });
          try{ this.events?.emit(EVENTS.EPISTEME_SYNC, { id: String(Date.now()) }); }catch{ /* best-effort */ }
          return { synced, showWork: showWork.slice(0,500) };
    }
}
