import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IVoidService } from '../../contracts/rivals19';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Void');
export class VoidService implements IVoidService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async session(file: string){ const id=genId('void'); await this.dal.kv.set(`void/${id}`, { file: file.slice(0,200), history: [] as string[] }); return id; }
    async assist(sessionId: string, prompt: string){
        const s=await this.dal.kv.get<Record<string,unknown>>(`void/${sessionId}`); if(!s) throw new Error('session not found');
        let out=`Void assist for ${prompt.slice(0,80)}`;
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'You are Void editor assistant.'},{role:'user',content:prompt.slice(0,1000)}],{temperature:0.4,maxTokens:500}); if(!r.error) out=r.content; } catch {} }
        const hist=(s as Record<string,unknown>).history as string[]; hist.push(prompt.slice(0,100)); await this.dal.kv.set(`void/${sessionId}`, s);
        return out.slice(0,2000);
    }
}
