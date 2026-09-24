import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAgentViewService } from '../../contracts/rivals14';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AgentView');
export class AgentViewService implements IAgentViewService {
    constructor(
        private dal: DataAccessLayer,
        private tools?: IToolRunnerService,
        private events?: IEventBus,
    ) {}
    async init(){         LOGGER.info('AgentView', 'init',{}); } async destroy(){}
    async sessions(){
        const rows=await this.dal.kv.list('cc-plan/');
        const res = rows.map(r=>{ const v=r.value as Record<string,string>; return { id: r.id, title: v.task ?? r.id }; }).slice(0,20);
        try{ this.events?.emit(EVENTS.AGENTVIEW_SESSIONS, { count: res.length }); }catch{ /* events best-effort */ }
        return res;
    }
    async skillViaContainer(skill: string, task: string){
        let out: string;
        if (this.tools) {
            try { const r=await this.tools.runWithTools(`Use skill ${skill}: ${task}`, { agentId: 'agentview', maxRounds: 2 }); out = r.output; } catch { out = `skill ${skill} via container: ${task.slice(0,100)}`; }
        } else {
            out = `skill ${skill} via container: ${task.slice(0,100)}`;
        }
        try{ this.events?.emit(EVENTS.AGENTVIEW_SKILL, { skill, task: task.slice(0,200) }); }catch{}
        return out;
    }
}
