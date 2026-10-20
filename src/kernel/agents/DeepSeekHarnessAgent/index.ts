import {
    DEEPSEEK_HARNESS_METADATA,
    DEEPSEEK_HARNESS_PERSONA,
    DEEPSEEK_HARNESS_TOOLS,
} from './persona';

export const DeepSeekHarnessAgentDefinition = {
    metadata: DEEPSEEK_HARNESS_METADATA,
    persona: DEEPSEEK_HARNESS_PERSONA,
    tools: DEEPSEEK_HARNESS_TOOLS,
    config: {
        roleName: DEEPSEEK_HARNESS_METADATA.role,
        prompt: DEEPSEEK_HARNESS_PERSONA,
        systemPrompt: DEEPSEEK_HARNESS_PERSONA,
        temperature: 0.1,
        tools: DEEPSEEK_HARNESS_TOOLS,
        displayName: DEEPSEEK_HARNESS_METADATA.displayName,
        firstName: DEEPSEEK_HARNESS_METADATA.firstName,
        lastName: DEEPSEEK_HARNESS_METADATA.lastName,
        baseRole: DEEPSEEK_HARNESS_METADATA.baseRole,
        avatar: DEEPSEEK_HARNESS_METADATA.avatar,
        provider: DEEPSEEK_HARNESS_METADATA.provider,
        model: DEEPSEEK_HARNESS_METADATA.model,
        specializations: DEEPSEEK_HARNESS_METADATA.specializations,
        lensIds: DEEPSEEK_HARNESS_METADATA.lensIds,
        permissionMode: 'workspace',
        toolProfile: 'coding',
    },
};
