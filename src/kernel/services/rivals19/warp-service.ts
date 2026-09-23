import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IWarpService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Warp');
export class WarpService implements IWarpService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Warp', 'init',{}); } async destroy(){}
    async block(input: string){ const id=genId('warp'); await this.dal.kv.set(`warp-block/${id}`, { input: input.slice(0,1000), output: `output for ${input.slice(0,40)}`, status: 'done' }); try{ this.events?.emit(EVENTS.WARP_BLOCK, { input: input.slice(0,200) }); }catch{} return id; }
    async workflow(name: string, steps: string[]){ const id=genId('warp-wf'); await this.dal.kv.set(`warp-wf/${id}`, { name: name.slice(0,80), steps: steps.slice(0,10) }); return id; }
    async aiCommand(prompt: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'You are Warp AI. Convert prompt to shell command, one line.'},{role:'user',content:prompt.slice(0,800)}],{temperature:0.2,maxTokens:100}); if(!r.error) return r.content.trim().slice(0,200); } catch {} }
        return `echo "${prompt.slice(0,80)}"`;
    }
}
