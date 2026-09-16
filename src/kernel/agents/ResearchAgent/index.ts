import { RESEARCH_METADATA, RESEARCH_PERSONA, RESEARCH_TOOLS } from './persona';

export const ResearchAgentDefinition = {
    metadata: RESEARCH_METADATA,
    persona: RESEARCH_PERSONA,
    tools: RESEARCH_TOOLS,
    config: {
        roleName: RESEARCH_METADATA.role,
        prompt: RESEARCH_PERSONA,
        temperature: 0.4,
        tools: RESEARCH_TOOLS,
        displayName: RESEARCH_METADATA.displayName,
        firstName: RESEARCH_METADATA.firstName,
        lastName: RESEARCH_METADATA.lastName,
        baseRole: RESEARCH_METADATA.baseRole,
        avatar: RESEARCH_METADATA.avatar,
        provider: RESEARCH_METADATA.provider,
        model: RESEARCH_METADATA.model,
        specializations: RESEARCH_METADATA.specializations,
        lensIds: RESEARCH_METADATA.lensIds,
    }
};
