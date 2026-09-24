import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IDeepResearch2Service } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Deep2');
export class DeepResearch2Service implements IDeepResearch2Service {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Deep2', 'init',{}); } async destroy(){}
    async run(topic: string){
        const stages=['Retriever','Enricher','Analyzer','Insight','Report'];
        let context=topic;
        const contradictions: string[]=[];
        for(const s of stages){
            if (this.llm) {
                try { const r=await this.llm.chat([{role:'system',content:`You are ${s} for deep research.`},{role:'user',content:context.slice(0,1500)}],{temperature:0.4,maxTokens:400}); if(!r.error) context=r.content; } catch { /* best-effort */ }
            }
            if (s==='Analyzer' && context.includes('however')) contradictions.push(`contradiction in ${context.slice(0,60)}`);
            await this.dal.kv.set(`deep2/${s}/${Date.now()}`, context.slice(0,500));
        }
        try{ this.events?.emit(EVENTS.DEEPRESEARCH2_RUN, { topic: topic.slice(0,200) }); }catch{ /* best-effort */ }
        return { report: `Report for ${topic.slice(0,80)}: ${context.slice(0,800)}`, contradictions: contradictions.slice(0,3) };
    }
}
