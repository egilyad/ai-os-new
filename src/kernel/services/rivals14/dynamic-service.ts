import type { IEventBus } from '../../types/interfaces';
import type { IRunQueueService } from '../../contracts/rivals';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IDynamicWorkflowService } from '../../contracts/rivals14';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('DynWF');
export class DynamicWorkflowService implements IDynamicWorkflowService {
    constructor(private events: IEventBus, private queue?: IRunQueueService, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async run(tasks: string[], checker?: string){
        if (!this.queue) return tasks.map(t=>`echo:${t.slice(0,40)}`);
        const ids: string[] = [];
        for (const t of tasks.slice(0,20)) { const q=await this.queue.enqueue('graph', t.slice(0,80)); ids.push(q.id); }
        const done=await this.queue.drain(4);
        // checker verifies
        if (checker && this.llm) {
            try { const r=await this.llm.chat([{role:'system',content:`Check work for: ${checker}`},{role:'user',content: done.map(d=>d.result??'').join('\n').slice(0,3000)}],{temperature:0.2,maxTokens:300}); if(!r.error && /fail/i.test(r.content)) return done.map(d=>`needs fix:${d.id}`); } catch {}
        }
        return done.map(d=>d.result ?? d.id);
    }
}
