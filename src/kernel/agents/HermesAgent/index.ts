import { HERMES_METADATA, HERMES_PERSONA, HERMES_SKILLS, HERMES_TOOLS } from './persona';

export const HermesAgentDefinition = {
    metadata: HERMES_METADATA,
    persona: HERMES_PERSONA,
    tools: HERMES_TOOLS,
    config: {
        roleName: HERMES_METADATA.role,
        prompt: HERMES_PERSONA,
        systemPrompt: HERMES_PERSONA,
        temperature: 0.2,
        tools: HERMES_TOOLS,
        displayName: HERMES_METADATA.displayName,
        firstName: HERMES_METADATA.firstName,
        lastName: HERMES_METADATA.lastName,
        baseRole: HERMES_METADATA.baseRole,
        avatar: HERMES_METADATA.avatar,
        provider: HERMES_METADATA.provider,
        model: HERMES_METADATA.model,
        specializations: HERMES_METADATA.specializations,
        lensIds: HERMES_METADATA.lensIds,
        skills: HERMES_SKILLS,
        permissionMode: 'guarded',
        toolProfile: 'research',
    },
};
