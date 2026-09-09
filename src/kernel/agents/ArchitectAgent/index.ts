import { ARCHITECT_METADATA, ARCHITECT_PERSONA, ARCHITECT_TOOLS } from './persona';

export const ArchitectAgentDefinition = {
    metadata: ARCHITECT_METADATA,
    persona: ARCHITECT_PERSONA,
    tools: ARCHITECT_TOOLS,
    config: {
        roleName: ARCHITECT_METADATA.role,
        prompt: ARCHITECT_PERSONA,
        temperature: 0.2,
        tools: ARCHITECT_TOOLS,
        // curated identity — canonical source (was AGENT_PROFILES)
        displayName: ARCHITECT_METADATA.displayName,
        firstName: ARCHITECT_METADATA.firstName,
        lastName: ARCHITECT_METADATA.lastName,
        baseRole: ARCHITECT_METADATA.baseRole,
        avatar: ARCHITECT_METADATA.avatar,
        provider: ARCHITECT_METADATA.provider,
        model: ARCHITECT_METADATA.model,
        specializations: ARCHITECT_METADATA.specializations,
        lensIds: ARCHITECT_METADATA.lensIds,
    }
};
