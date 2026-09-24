import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICogTeamService } from '../../contracts/rivals16';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('CogTeam');
export class CogTeamService implements ICogTeamService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('CogTeam', 'init',{}); } async destroy(){}
    async run(task: string){
        const maestro=`Maestro plans: ${task.slice(0,80)}`;
        const mem=`Memory recalls: prior context for ${task.slice(0,40)}`;
        const critic=`Critic: check ${task.slice(0,40)} for gaps`;
        const engine=`Engine executes: ${task.slice(0,80)}`;
        let out=`${maestro}\n${mem}\n${critic}\n${engine}`;
        if (this.llm) {
            try {
                const r=await this.llm.chat([{role:'system',content:'You are CogTeam: Maestro/Memory/Critic/Engine. One paragraph each, then final.'},{role:'user',content:task.slice(0,2000)}],{temperature:0.4,maxTokens:800});
                if(!r.error) out=r.content;
            } catch { /* best-effort */ }
        }
        await this.dal.kv.set(`cogteam/${Date.now()}`, out.slice(0,3000));
        try{ this.events?.emit(EVENTS.COGTEAM_RUN, { task: task.slice(0,200) }); }catch{ /* best-effort */ }
        return out.slice(0,3000);
    }
}
