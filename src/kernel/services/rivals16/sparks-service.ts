import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISparksService } from '../../contracts/rivals16';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Sparks');
export class SparksService implements ISparksService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Sparks', 'init',{}); } async destroy(){}
    async cycle(hypothesis: string){
        let experiment=`Experiment for "${hypothesis.slice(0,80)}": test in sandbox`;
        let principle=`Principle from "${hypothesis.slice(0,40)}": emergent pattern`;
        if (this.llm) {
            try {
                const r=await this.llm.chat([{role:'system',content:'You run Sparks cycle: hypothesis→experiment→principle. Reply JSON {"experiment":"...","principle":"..."}'},{role:'user',content:hypothesis.slice(0,1000)}],{temperature:0.4,maxTokens:500});
                if(!r.error){ const m=r.content.match(/\{[\s\S]*\}/); if(m){ const p=JSON.parse(m[0]) as Record<string,string>; experiment=p.experiment||experiment; principle=p.principle||principle; } }
            } catch (e){ LOGGER.warn('Sparks', 'sparks failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        await this.dal.kv.set(`sparks/${Date.now()}`, { hypothesis: hypothesis.slice(0,300), experiment, principle });
        try{ this.events?.emit(EVENTS.SPARKS_CYCLE, { hypothesis: hypothesis.slice(0,200) }); }catch{ /* best-effort */ }
        return { experiment: experiment.slice(0,500), principle: principle.slice(0,500) };
    }
}
