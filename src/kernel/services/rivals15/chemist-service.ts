import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IChemistService } from '../../contracts/rivals15';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Chemist');
export class ChemistService implements IChemistService {
    constructor(private events: IEventBus, private llm?: ILLMClientService, private knowledge?: IKnowledgeService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async ask(question: string){
        let rag='';
        if (this.knowledge) { try { const hits=await this.knowledge.retrieve(question,3); rag=hits.map(h=>`[${h.title}] ${h.chunk.slice(0,400)}`).join('\n'); } catch {} }
        let out: string;
        if (this.llm) {
            try {
                const r=await this.llm.chat([
                    {role:'system',content:'You are Chemist, organic synthesis expert (ITMO). Answer with RAG context, SMILES if relevant.'},
                    {role:'user',content:`Question: ${question.slice(0,1000)}\nRAG:\n${rag.slice(0,3000) || '(empty)'}`}
                ],{temperature:0.3,maxTokens:800});
                if(!r.error) {
                    out = r.content;
                    try{ this.events.emit(EVENTS.CHEMIST_ASK, { question: question.slice(0,200), hasRag: rag.length>0 }); }catch{}
                    return out;
                }
            } catch (e){ LOGGER.warn('chemist failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        out = `Chemist (offline): ${question.slice(0,200)} — RAG: ${rag.slice(0,300) || 'no data'}`;
        try{ this.events.emit(EVENTS.CHEMIST_ASK, { question: question.slice(0,200), hasRag: rag.length>0 }); }catch{}
        return out;
    }
}
