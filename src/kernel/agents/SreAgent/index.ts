import { SRE_AGENT_METADATA, SRE_AGENT_PERSONA } from './persona';
import { SRE_AGENT_TOOLS } from './tools';
import { SRE_AGENT_JOURNAL_HOOKS } from './journal';
import { AdvisorService, AdvisorServiceDeps } from '../../services/advisor-service';

export const SreAgentDefinition = {
    metadata: SRE_AGENT_METADATA,
    persona: SRE_AGENT_PERSONA,
    tools: SRE_AGENT_TOOLS,
    journalHooks: SRE_AGENT_JOURNAL_HOOKS,
    factory: (deps: AdvisorServiceDeps) => new AdvisorService(deps),
    config: {
        roleName: SRE_AGENT_METADATA.role,
        prompt: SRE_AGENT_PERSONA,
        temperature: 0.2,
        tools: SRE_AGENT_TOOLS,
        // curated identity — canonical source (mirrors Architect/Research/Network/Risk/DocAuditor)
        displayName: SRE_AGENT_METADATA.displayName,
        firstName: SRE_AGENT_METADATA.firstName,
        lastName: SRE_AGENT_METADATA.lastName,
        baseRole: SRE_AGENT_METADATA.baseRole,
        avatar: SRE_AGENT_METADATA.avatar,
        provider: SRE_AGENT_METADATA.provider,
        model: SRE_AGENT_METADATA.model,
        specializations: SRE_AGENT_METADATA.specializations,
        lensIds: SRE_AGENT_METADATA.lensIds,
    },
};
