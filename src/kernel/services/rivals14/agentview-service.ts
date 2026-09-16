import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAgentViewService } from '../../contracts/rivals14';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AgentView');
export class AgentViewService implements IAgentViewService {
    constructor(private dal: DataAccessLayer, private tools?: IToolRunnerService) {}
    async init(){ LOGGER.info('AgentView', 'init',{}); } async destroy(){}
    async sessions(){
        const rows=await this.dal.kv.list('cc-plan/');
        return rows.map(r=>{ const v=r.value as Record<string,string>; return { id: r.id, title: v.task ?? r.id }; }).slice(0,20);
    }
    async skillViaContainer(skill: string, task: string){
        if (this.tools) {
            try { const r=await this.tools.runWithTools(`Use skill ${skill}: ${task}`, { agentId: 'agentview', maxRounds: 2 }); return r.output; } catch {}
        }
        return `skill ${skill} via container: ${task.slice(0,100)}`;
    }
}
