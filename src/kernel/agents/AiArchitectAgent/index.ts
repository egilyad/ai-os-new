import { AI_ARCHITECT_METADATA, AI_ARCHITECT_PERSONA } from './persona';

export const AiArchitectAgentDefinition = {
    metadata: AI_ARCHITECT_METADATA,
    persona: AI_ARCHITECT_PERSONA,
    config: {
        roleName: AI_ARCHITECT_METADATA.role,
        prompt: AI_ARCHITECT_PERSONA,
        temperature: 0.4,
        tools: [],
        displayName: AI_ARCHITECT_METADATA.displayName,
        firstName: AI_ARCHITECT_METADATA.firstName,
        lastName: AI_ARCHITECT_METADATA.lastName,
        baseRole: AI_ARCHITECT_METADATA.baseRole,
        avatar: AI_ARCHITECT_METADATA.avatar,
        provider: AI_ARCHITECT_METADATA.provider,
        model: AI_ARCHITECT_METADATA.model,
        specializations: AI_ARCHITECT_METADATA.specializations,
        lensIds: AI_ARCHITECT_METADATA.lensIds,
    },
};
