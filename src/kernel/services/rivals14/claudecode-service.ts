import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICoordinationService } from '../../contracts/interop';
import type { IClaudeCodeService } from '../../contracts/rivals14';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('ClaudeCode');
export class ClaudeCodeService implements IClaudeCodeService {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private llm?: ILLMClientService, private coord?: ICoordinationService) {}
    async init(){ LOGGER.info('ClaudeCode', 'init',{}); } async destroy(){}
    async proposePlan(task: string){
        const id=genId('plan');
        let content=`Plan for ${task.slice(0,120)}: 1) analyze 2) edit 3) test`;
        if (this.llm) {
            try { const r=await this.llm.chat([{role:'system',content:'Propose a 3-step plan for the task, one per line.'},{role:'user',content:task.slice(0,2000)}],{temperature:0.3,maxTokens:400}); if(!r.error) content=r.content; } catch {}
        }
        await this.dal.kv.set(`cc-plan/${id}`, { id, task: task.slice(0,500), content, approved:false });
        return id;
    }
    async approvePlan(planId: string){ const p=await this.dal.kv.get<Record<string,unknown>>(`cc-plan/${planId}`); if(!p) throw new Error('plan not found'); (p as Record<string,unknown>).approved=true; await this.dal.kv.set(`cc-plan/${planId}`, p); }
    async executePlan(planId: string){
        const p=await this.dal.kv.get<Record<string,unknown>>(`cc-plan/${planId}`); if(!p) throw new Error('plan not found'); if(!(p as Record<string,unknown>).approved) throw new Error('plan not approved — use plan mode');
        const task=(p as Record<string,string>).task;
        // hooks pre
        const hooks=(await this.dal.kv.get<string[]>(`cc-hooks/pre`))??[];
        let out=`Executing ${planId}: ${task}\nHooks pre: ${hooks.join(', ')||'none'}\n`;
        if (this.coord) { try { out+=await this.coord.spawnSubCrew(task); } catch {} }
        this.events.emit(EVENTS.CLAUDECODE_EXEC, { planId } as never);
        return out.slice(0,4000);
    }
    async addHook(event: string, command: string){ const k=`cc-hooks/${event}`; const list=(await this.dal.kv.get<string[]>(k))??[]; list.push(command.slice(0,200)); await this.dal.kv.set(k, list); }
    async loadPlugin(name: string){ await this.dal.kv.set(`cc-plugin/${name.slice(0,80)}`, { at: Date.now() }); }
    async slashCommand(cmd: string, args=''){ return `/${cmd} ${args} — executed (slash command)`.slice(0,500); }
    async spawnSubagent(task: string){ if (this.coord) return this.coord.spawnSubCrew(task); return `subagent:${genId('sub')}:${task.slice(0,40)}`; }
}
