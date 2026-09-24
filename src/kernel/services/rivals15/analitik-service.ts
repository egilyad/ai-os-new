import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IAnalitikService } from '../../contracts/rivals15';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Analitik');
export class AnalitikService implements IAnalitikService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Analitik', 'init',{}); } async destroy(){}
    async intake(request: string){
        const id=genId('analitik');
        // GigaChat style: Intake → Supervisor → Proposal
        const intake=await this.ask(`Ты Intake (GigaChat). Извлеки требования из запроса:\n${request.slice(0,1000)} — 3 bullet.`);
        const plan=await this.ask(`Ты Supervisor. Спланируй 3 шага для:\n${intake.slice(0,800)}`);
        const proposal=await this.ask(`Ты Proposal. Сделай предложение (сроки, бюджет, риски) для:\n${plan.slice(0,800)}\nИсходный запрос: ${request.slice(0,500)}`);
        await this.dal.kv.set(`analitik/${id}`, { id, request: request.slice(0,500), intake, plan, proposal, at: Date.now() });
        try{ this.events?.emit(EVENTS.ANALITIK_INTAKE, { id }); }catch{ /* best-effort */ }
        return `Proposal ${id}:\n${proposal.slice(0,1500)}`;
    }
    private async ask(prompt: string){
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Ты агент Analitik Lab (GigaChat).'},{role:'user',content:prompt.slice(0,3000)}],{temperature:0.4,maxTokens:600}); if(!r.error) return r.content; } catch { /* best-effort */ } }
        return `[echo] ${prompt.slice(0,200)}`;
    }
}
