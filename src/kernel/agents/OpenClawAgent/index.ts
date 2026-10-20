import { OPENCLAW_METADATA, OPENCLAW_PERSONA, OPENCLAW_TOOLS } from './persona';

export const OpenClawAgentDefinition = {
    metadata: OPENCLAW_METADATA,
    persona: OPENCLAW_PERSONA,
    tools: OPENCLAW_TOOLS,
    config: {
        roleName: OPENCLAW_METADATA.role,
        prompt: OPENCLAW_PERSONA,
        systemPrompt: OPENCLAW_PERSONA,
        temperature: 0.25,
        tools: OPENCLAW_TOOLS,
        displayName: OPENCLAW_METADATA.displayName,
        firstName: OPENCLAW_METADATA.firstName,
        lastName: OPENCLAW_METADATA.lastName,
        baseRole: OPENCLAW_METADATA.baseRole,
        avatar: OPENCLAW_METADATA.avatar,
        provider: OPENCLAW_METADATA.provider,
        model: OPENCLAW_METADATA.model,
        specializations: OPENCLAW_METADATA.specializations,
        lensIds: OPENCLAW_METADATA.lensIds,
        permissionMode: 'guarded',
        toolProfile: 'coding',
    },
};
