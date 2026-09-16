import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICognitaeService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Cognitae');
const ROLES=['Scholar','Syn','Axis','Critic','Memory','Weaver','Curator','Analyst','Scribe','Guardian','Scout','Archivist','Mediator','Auditor','Strategist','Librarian','Interpreter','Synthesizer','Validator','Explorer','Reflector','Orchestrator'];
export class CognitaeService implements ICognitaeService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){
        LOGGER.info('Cognitae', 'init',{}); 
        for (const r of ROLES) await this.dal.kv.set(`cognitae-role/${r}`, { role: r, yaml: `role: ${r}\narch: strict` });
    }
    async destroy(){}
    async roles(){ return [...ROLES]; }
    async run(task: string){
        let out=`Cognitae 22 for ${task.slice(0,80)}: Scholar synthesizes, Syn weaves, Axis checks coherence`;
        if (this.llm) {
            try {
                const r=await this.llm.chat([{role:'system',content:'You are Cognitae Scholar+Syn+Axis. Synthesize coherently.'},{role:'user',content:task.slice(0,2000)}],{temperature:0.4,maxTokens:800});
                if(!r.error) out=r.content;
            } catch {}
        }
        await this.dal.kv.set(`cognitae-run/${Date.now()}`, out.slice(0,3000));
        return out.slice(0,3000);
    }
}
