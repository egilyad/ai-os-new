import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICogneeService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Cognee');
export class CogneeService implements ICogneeService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async ingest(text: string){
        const id=`cognee-${Date.now()}`;
        let entities: string[] = [];
        if (this.llm) {
            try { const r=await this.llm.chat([{role:'system',content:'Extract entities, one per line "- ".'},{role:'user',content:text.slice(0,3000)}],{temperature:0.2,maxTokens:400}); if(!r.error) entities=r.content.split('\n').map(l=>l.replace(/^-\s*/,'').trim()).filter(Boolean).slice(0,8); } catch {}
        }
        if (entities.length===0) entities=text.split(/[^a-zа-яё0-9]+/iu).filter(w=>w.length>4).slice(0,5);
        await this.dal.kv.set(`cognee/${id}`, { text: text.slice(0,2000), entities });
          for (const e of entities) await this.dal.kv.set(`cognee-edge/${id}/${e}`, { at: Date.now() });
          try{ this.events?.emit(EVENTS.COGNEE_RECALL, { query: text.slice(0,100) }); }catch{}
          return id;
    }
      async recall(query: string){
          const rows=await this.dal.kv.list('cognee/');
          const scored=rows.map(r=>{ const v=r.value as {text:string}; const score=v.text.toLowerCase().split(query.toLowerCase().slice(0,20)).length; return { id: r.id, score, text: v.text }; }).sort((a,b)=>b.score-a.score).slice(0,3);
          try{ this.events?.emit(EVENTS.COGNEE_RECALL, { query: query.slice(0,100) }); }catch{}
          return scored.map(s=>s.text.slice(0,400));
    }
}
