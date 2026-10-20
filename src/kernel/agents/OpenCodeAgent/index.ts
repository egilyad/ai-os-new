import { OPENCODE_METADATA, OPENCODE_PERSONA, OPENCODE_TOOLS } from './persona';

export const OpenCodeAgentDefinition = {
    metadata: OPENCODE_METADATA,
    persona: OPENCODE_PERSONA,
    tools: OPENCODE_TOOLS,
    config: {
        roleName: OPENCODE_METADATA.role,
        prompt: OPENCODE_PERSONA,
        // Orchestrator reads config.systemPrompt; chat/resolver reads config.prompt.
        systemPrompt: OPENCODE_PERSONA,
        temperature: 0.15,
        tools: OPENCODE_TOOLS,
        displayName: OPENCODE_METADATA.displayName,
        firstName: OPENCODE_METADATA.firstName,
        lastName: OPENCODE_METADATA.lastName,
        baseRole: OPENCODE_METADATA.baseRole,
        avatar: OPENCODE_METADATA.avatar,
        provider: OPENCODE_METADATA.provider,
        model: OPENCODE_METADATA.model,
        specializations: OPENCODE_METADATA.specializations,
        lensIds: OPENCODE_METADATA.lensIds,
        // Permission / tool policy (ported from OpenCode + OpenClaw).
        permissionMode: 'workspace',
        toolProfile: 'coding',
    },
};
