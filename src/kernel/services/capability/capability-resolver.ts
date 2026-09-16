import type { DataAccessLayer } from '../../dal/types';
import type { ICapabilityResolver } from '../../contracts/capability';
import type { AgentDefinition, ResolvedAgent } from '../../types/capability-types';
import type { IPersonaService } from '../../contracts/persona';
import type { ISkillMarketService } from '../../contracts/ops';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IGovernanceService } from '../../contracts/trust';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('CapabilityResolver');
export class CapabilityResolver implements ICapabilityResolver {
    constructor(private dal: DataAccessLayer, private persona?: IPersonaService, private skills?: ISkillMarketService, private tools?: IToolRunnerService, private gov?: IGovernanceService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async skillToTools(skillIds: string[]){
        if (!this.skills || skillIds.length===0) return [];
        const all = await this.skills.list().catch(()=>[]);
        const tools: string[] = [];
        const missingSkills: string[] = [];
        for (const id of skillIds) {
            const s = all.find(x=>x.id===id || x.name===id);
            if (!s) { missingSkills.push(id); continue; }
            if (s?.permissions) tools.push(...s.permissions);
        }
        if (missingSkills.length>0) LOGGER.warn('skillToTools: missing skills', { missingSkills });
        // validate against ToolRunner registry (existing mechanism, no duplicate)
        if (this.tools) {
            const available = new Set(this.tools.listTools().map(t=>t.name));
            const unknown = tools.filter(t=>!available.has(t) && !available.has(t.split('.')[0] as string));
            if (unknown.length>0) LOGGER.warn('skillToTools: tools not in registry (will be gated)', { unknown });
        }
        return [...new Set(tools)];
    }
    async personaToPrompt(personaId?: string){
        if (!personaId || !this.persona) return '';
        try { return await this.persona.promptFor(personaId); } catch { return ''; }
    }
    async roleToPolicy(roleId: string){
        if (!this.gov) return { ok: true };
        try { const ok = await this.gov.checkCapability(`role:${roleId}`, 'agent:execute'); return { ok, reason: ok?undefined:'policy deny' }; } catch { return { ok: true }; }
    }
    async resolve(def: AgentDefinition): Promise<ResolvedAgent>{
        const [prompt, skillTools, policy] = await Promise.all([
            this.personaToPrompt(def.personaId),
            this.skillToTools(def.skillIds),
            this.roleToPolicy(def.roleId),
        ]);
        const tools = [...new Set([...def.toolIds, ...skillTools])];
        return { definition: def, prompt, tools, model: def.model ?? 'auto', policyOk: policy.ok };
    }
}
