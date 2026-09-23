import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ICogMemoryService } from '../../contracts/meta';
import type { IAgentFactory } from '../../contracts/capability';
import type { ICapabilityResolver } from '../../contracts/capability';
import type { AgentDefinition } from '../../types/capability-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('AgentFactory');
export class AgentFactory implements IAgentFactory {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private resolver: ICapabilityResolver, private llm?: ILLMClientService, private tools?: IToolRunnerService, private memory?: ICogMemoryService) {}
    async init(){ LOGGER.info('AgentFactory', 'init'); } async destroy(){}
    async create(input: Omit<AgentDefinition,'id'|'createdAt'|'updatedAt'>){
        const now=Date.now();
        const def: AgentDefinition = { id: genId('agent'), createdAt: now, updatedAt: now, ...input };
        // VALIDATE → AUTHORIZE → BIND via resolver (existing mechanism, no duplicate)
        const resolved = await this.resolver.resolve(def);
        if (!resolved.policyOk) throw new Error('policy deny for role');
        await this.dal.kv.set(`agent-def/${def.id}`, def);
        this.events.emit(EVENTS.AGENT_CREATED, { agentId: def.id });
        return def;
    }
    /** 2. Удобный API: create → ResolvedAgent одним вызовом (стандарт для всех подсистем) */
    async createResolved(input: Omit<AgentDefinition,'id'|'createdAt'|'updatedAt'>){
        const def = await this.create(input);
        return this.resolve(def.id);
    }
    async get(id: string){ return (await this.dal.kv.get<AgentDefinition>(`agent-def/${id}`)) ?? null; }
    async resolve(id: string){
        const def = await this.get(id); if(!def) throw new Error('agent not found');
        return this.resolver.resolve(def);
    }
    async execute(id: string, task: string){
        const resolved = await this.resolve(id);
        // LLM → Tools → Memory → Persist → Observe
        let output = '';
        const toolCalls: string[] = [];
        if (this.tools && resolved.tools.length>0) {
            try {
                const r = await this.tools.runWithTools(task, { agentId: id, system: resolved.prompt, maxRounds: 2 });
                output = r.output; toolCalls.push(...r.toolCalls);
            } catch (e){ LOGGER.warn('AgentFactory', 'tool run failed', { error: e instanceof Error ? e.message : String(e) }); }
        }
        if (!output && this.llm) {
            try {
                const r = await this.llm.chat([{role:'system',content:resolved.prompt || 'You are an agent.'},{role:'user',content:task.slice(0,4000)}],{temperature:0.4,maxTokens:800});
                if(!r.error) output=r.content;
            } catch {}
        }
        if (!output) output=`[echo:${resolved.definition.name}] ${task.slice(0,200)}`;
        // PERSIST memory
        if (this.memory) {
            try { await this.memory.write({ kind:'episodic', scope:'private', ownerId: id, content: `task:${task.slice(0,200)} → ${output.slice(0,300)}`, importance: 0.6 }); } catch {}
        }
        await this.dal.kv.set(`agent-run/${id}/${Date.now()}`, { task: task.slice(0,300), output: output.slice(0,2000), toolCalls });
        this.events.emit(EVENTS.AGENT_EXECUTED, { agentId: id });
        return { output: output.slice(0,4000), toolCalls };
    }
}
