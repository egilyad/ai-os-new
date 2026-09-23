import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ILatentService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Latent');
export class LatentService implements ILatentService {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('Latent', 'init',{}); } async destroy(){}
    async post(agent: string, text: string){ const list=(await this.dal.kv.get<string[]>(`latent/board`))??[]; list.push(`${agent}: ${text.slice(0,300)}`); if(list.length>50) list.splice(0,list.length-50); await this.dal.kv.set('latent/board', list); }
    async synthesize(){
        const board=(await this.dal.kv.get<string[]>('latent/board'))??[];
        if(board.length===0) return '(empty blackboard)';
        let synth=`Latent synthesis of ${board.length} posts`;
        if (this.llm) {
            try {
                const r=await this.llm.chat([
                    {role:'system',content:'Synthesize blackboard via MDL: shortest theory + Popper falsification + counterfactual. One paragraph.'},
                    {role:'user',content:board.join('\n').slice(0,4000)}
                ],{temperature:0.4,maxTokens:500});
                if(!r.error) synth=r.content;
            } catch (e){ LOGGER.warn('Latent', 'latent failed',{error:e instanceof Error?e.message:String(e)}); }
        } else { synth=`MDL synthesis: ${board.slice(-3).join(' | ').slice(0,300)}`; }
        this.events.emit(EVENTS.LATENT_SYNTH, { agents: 9 } as never);
        return synth.slice(0,2000);
    }
}
