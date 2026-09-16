import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IGptEngineerService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('GptEngineer');
export class GptEngineerService implements IGptEngineerService {
    constructor(
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async run(spec: string){
        let clarify=`Spec: ${spec.slice(0,100)}`;
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Ask 2 clarifying questions, "- " each.'},{role:'user',content:spec.slice(0,1000)}],{temperature:0.4,maxTokens:200}); if(!r.error) clarify=r.content; } catch {} }
        let files=['README.md'];
        if (this.tools) {
            try { const r=await this.tools.runWithTools(`Generate files for: ${spec.slice(0,500)}`,{agentId:'gpt-engineer',maxRounds:2}); files=r.output.split('\n').filter(l=>l.includes('.')).slice(0,5); if(files.length===0) files=['app.py']; } catch {}
        }
        try{ this.events?.emit(EVENTS.GPTENGINEER_RUN, { spec: spec.slice(0,200) }); }catch{}
        return { files, log: clarify.slice(0,500) };
    }
}
