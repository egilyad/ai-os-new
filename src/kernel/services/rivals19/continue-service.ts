import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IContinueService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Continue');
export class ContinueService implements IContinueService {
    constructor(private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('Continue', 'init',{}); } async destroy(){}
    async autocomplete(prefix: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Autocomplete code, one line.'},{role:'user',content:prefix.slice(-500)}],{temperature:0.2,maxTokens:40}); if(!r.error) return r.content.trim().slice(0,100); } catch {} }
        return `${prefix} // autocomplete`;
    }
    async chat(message: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'user',content:message.slice(0,2000)}],{temperature:0.4,maxTokens:500}); if(!r.error) return r.content; } catch {} }
        return `Continue: ${message.slice(0,100)}`;
    }
}
