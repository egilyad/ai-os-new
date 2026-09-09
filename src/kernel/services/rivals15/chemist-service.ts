import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IChemistService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Chemist');
export class ChemistService implements IChemistService {
    constructor(private events: IEventBus, private llm?: ILLMClientService, private knowledge?: IKnowledgeService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async ask(question: string){
        let rag='';
        if (this.knowledge) { try { const hits=await this.knowledge.retrieve(question,3); rag=hits.map(h=>`[${h.title}] ${h.chunk.slice(0,400)}`).join('\n'); } catch {} }
        if (this.llm) {
            try {
                const r=await this.llm.chat([
                    {role:'system',content:'Ты химик-органик (Сбер×ITMO). Отвечай с RAG-цитатами. Если SMILES — помоги.'},
                    {role:'user',content:`Вопрос: ${question.slice(0,1000)}\nRAG:\n${rag.slice(0,3000) || '(нет)'}`}
                ],{temperature:0.3,maxTokens:800});
                if(!r.error) return r.content;
            } catch (e){ LOGGER.warn('chemist failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        return `Химик-органик (offline): ${question.slice(0,200)} — RAG: ${rag.slice(0,300) || 'нет данных'}`;
    }
}
