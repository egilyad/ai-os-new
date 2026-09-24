import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IVoyagerService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Voyager');
export class VoyagerService implements IVoyagerService {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private llm?: ILLMClientService, private tools?: IToolRunnerService) {}
    async init(){ LOGGER.info('Voyager', 'init',{}); } async destroy(){}
    async addSkill(name: string, code: string){
        await this.dal.kv.set(`voyager-skills/${name.slice(0,80)}`, code.slice(0,8000));
        this.events.emit(EVENTS.VOYAGER_SKILL, { name });
    }
    async proposeGoal(context = ''){
        if (this.llm) {
            try {
                const skills = (await this.dal.kv.list('voyager-skills/')).map(r=>r.id.replace('voyager-skills/','')).slice(0,10).join(', ') || 'none';
                const res = await this.llm.chat([
                    { role: 'system', content: `Propose next Voyager goal (curriculum). Skills: ${skills}. One short goal.` },
                    { role: 'user', content: context.slice(0,1000) }
                ], { temperature: 0.6, maxTokens: 120 });
                if (!res.error) return res.content.trim().slice(0,200);
            } catch { /* llm optional */ }
        }
        return context ? `Explore: ${context.slice(0,80)}` : 'Collect wood';
    }
    async verify(goal: string, evidence: string){
        if (this.tools) {
            try {
                const res = await this.tools.runWithTools(`Verify goal "${goal}" with evidence: ${evidence.slice(0,1000)} — reply YES or NO.`, { agentId: 'voyager', maxRounds: 1 });
                if (/yes/i.test(res.output)) return true;
                if (/no/i.test(res.output)) return false;
            } catch { /* tools optional */ }
        }
        return evidence.toLowerCase().includes(goal.toLowerCase().split(' ')[0] ?? '');
    }
    async step(){
        const goal = await this.proposeGoal();
        let evidence = '(no tools)';
        if (this.tools) {
            try { const r = await this.tools.runWithTools(goal, { agentId: 'voyager', maxRounds: 2 }); evidence = r.output; } catch { /* tools optional */ }
        }
        const ok = await this.verify(goal, evidence);
        if (ok && evidence.length > 20) {
            await this.addSkill(goal.slice(0,60), `// auto-skill for ${goal}\n${evidence.slice(0,1000)}`);
        }
        this.events.emit(EVENTS.VOYAGER_STEP, { ok });
        return { goal, ok };
    }
}
