import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ILocalTripleService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('LocalTriple');
export class LocalTripleService implements ILocalTripleService {
    constructor(private events: IEventBus, private llm?: ILLMClientService, private tools?: IToolRunnerService) {}
    async init(){ LOGGER.info('LocalTriple', 'init',{}); } async destroy(){}
    async run(task: string){
        const plan=await this.ask(`Ты Planner (Ollama local). Разбей задачу на 3 шага, каждый "- ". Задача: ${task.slice(0,800)}`);
        const result=await this.exec(plan);
        const critique=await this.ask(`Ты Critic. Оцени результат по задаче "${task.slice(0,100)}"\nПлан:\n${plan}\nРезультат:\n${result}\nКоротко: что улучшить (1 фраза) или "OK".`);
        this.events.emit(EVENTS.LOCALTRIPLE_RUN, { ok: /ok/i.test(critique) } as never);
        return { plan, result, critique };
    }
    private async ask(prompt: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Ты локальный агент Ollama.'},{role:'user',content:prompt.slice(0,3000)}],{temperature:0.4,maxTokens:600}); if(!r.error) return r.content; } catch (e){ LOGGER.warn('LocalTriple', 'ask failed',{error:e instanceof Error?e.message:String(e)}); } }
        return `[echo] ${prompt.slice(0,200)}`;
    }
    private async exec(plan: string){
        if (this.tools) { try { const r=await this.tools.runWithTools(plan, { agentId: 'local-executor', maxRounds: 2 }); return r.output; } catch { /* best-effort */ } }
        return await this.ask(`Исполни план:\n${plan}`);
    }
}
