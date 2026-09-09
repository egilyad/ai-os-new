import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISkillMarketService } from '../../contracts/ops';
import type { IRuslanService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Ruslan');
export class RuslanService implements IRuslanService {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private llm?: ILLMClientService, private skills?: ISkillMarketService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async learn(skill: string, example: string){
        await this.dal.kv.set(`ruslan-skill/${skill.slice(0,80)}`, { example: example.slice(0,2000), at: Date.now() });
        // самообучение: успех → новый skill в маркет
        if (this.skills) {
            try { await this.skills.publish({ name: `ruslan-${skill.slice(0,40)}`, version: '1.0.0', description: `Ruslan learned: ${skill.slice(0,100)}`, permissions: [], entry: 'ruslan.ts', author: 'ruslan' }); } catch {}
        }
        this.events.emit(EVENTS.RUSLAN_LEARN, { skill } as never);
    }
    async use(skill: string, task: string){
        const ex=await this.dal.kv.get<Record<string,unknown>>(`ruslan-skill/${skill}`);
        const ctx=(ex as Record<string,string>)?.example ?? '';
        if (this.llm) {
            try {
                const r=await this.llm.chat([
                    {role:'system',content:`Ты Ruslan (YandexGPT/GigaChat). Навык ${skill}: ${ctx.slice(0,500)}`},
                    {role:'user',content:task.slice(0,2000)}
                ],{temperature:0.5,maxTokens:800});
                if(!r.error) return r.content;
            } catch (e){ LOGGER.warn('ruslan use failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        return `[Ruslan:${skill}] ${task.slice(0,200)} (offline)`;
    }
}
