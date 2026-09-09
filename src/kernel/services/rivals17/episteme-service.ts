import type { DataAccessLayer } from '../../dal/types';
import type { IEpistemeService } from '../../contracts/rivals17';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Episteme');
export class EpistemeService implements IEpistemeService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async sync(agentState: string, humanState: string){
        const synced=agentState.slice(0,100)===humanState.slice(0,100) || agentState.includes(humanState.slice(0,20));
        const showWork=`Agent: ${agentState.slice(0,200)} | Human: ${humanState.slice(0,200)} | synced=${synced}`;
        await this.dal.kv.set(`episteme/${Date.now()}`, { agentState: agentState.slice(0,300), humanState: humanState.slice(0,300), synced });
        return { synced, showWork: showWork.slice(0,500) };
    }
}
