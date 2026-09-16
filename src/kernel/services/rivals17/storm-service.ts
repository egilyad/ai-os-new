import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IStormService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('STORM');
export class StormService implements IStormService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private knowledge?: IKnowledgeService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async research(topic: string){
        let perspectives=['technical','economic','ethical'];
        if (this.llm) {
            try { const r=await this.llm.chat([{role:'system',content:'List 3 research perspectives, one per line "- ".'},{role:'user',content:topic.slice(0,800)}],{temperature:0.5,maxTokens:300}); if(!r.error) perspectives=r.content.split('\n').map(l=>l.replace(/^-\s*/,'').trim()).filter(Boolean).slice(0,3); } catch {}
        }
        const parts: string[]=[];
        for(const p of perspectives){
            let hits='';
            if (this.knowledge) { try { const h=await this.knowledge.retrieve(`${topic} ${p}`,2); hits=h.map(x=>x.chunk.slice(0,200)).join('; '); } catch {} }
            parts.push(`[${p}] ${hits || 'perspective research'}`);
        }
        const synth=`STORM synthesis for ${topic.slice(0,80)}: ${parts.join(' | ').slice(0,800)} — debate: ${perspectives.join(' vs ')}`;
          await this.dal.kv.set(`storm/${Date.now()}`, { topic: topic.slice(0,200), synth });
          try{ this.events?.emit(EVENTS.STORM_RESEARCH, { topic: topic.slice(0,200) }); }catch{}
          return synth.slice(0,2000);
    }
}
