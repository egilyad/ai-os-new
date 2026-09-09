import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICodexService, IGeminiCliService, IKiloService } from '../../contracts/rivals20';
import { rootLogger } from '../logger-service';
const L1 = rootLogger.child('Codex');
export class CodexService implements ICodexService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){ L1.info('init',{}); } async destroy(){}
    async prompt(prompt: string){
        let diff=`--- a/file\n+++ b/file\n+${prompt.slice(0,40)}`;
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Generate unified diff, 3 lines.'},{role:'user',content:prompt.slice(0,1000)}],{temperature:0.2,maxTokens:300}); if(!r.error) diff=r.content; } catch {} }
        await this.dal.kv.set(`codex/${Date.now()}`, diff.slice(0,2000));
        return { diff: diff.slice(0,2000), applied: true };
    }
}
export class GeminiCliService implements IGeminiCliService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){} async destroy(){}
    async chat(message: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'user',content:message.slice(0,2000)}],{temperature:0.4,maxTokens:500}); if(!r.error) return r.content; } catch {} }
        return `Gemini CLI: ${message.slice(0,100)}`;
    }
}
export class KiloService implements IKiloService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){} async destroy(){}
    async fanout(prompt: string, models?: string[]){
        const list=(models??['gemini','openai','deepseek']).slice(0,5);
        const out:string[]=[];
        for(const m of list){
            if (this.llm) { try { const r=await this.llm.chat([{role:'user',content:prompt.slice(0,1000)}],{temperature:0.4,maxTokens:400, provider: m} as never); out.push(r.error?`[${m} error]`:r.content.slice(0,500)); continue; } catch {} }
            out.push(`[${m}] ${prompt.slice(0,80)}`);
        }
        await this.dal.kv.set(`kilo/${Date.now()}`, { prompt: prompt.slice(0,100), models: list });
        return out;
    }
    async catalog(){ const rows=await this.dal.kv.list('kilo/'); return rows.map(r=>r.id).slice(0,20); }
}
