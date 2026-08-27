import { DOC_AUDITOR_METADATA, DOC_AUDITOR_PERSONA } from './persona';

export const DocAuditorAgentDefinition = {
    metadata: DOC_AUDITOR_METADATA,
    persona: DOC_AUDITOR_PERSONA,
    config: {
        roleName: DOC_AUDITOR_METADATA.role,
        prompt: DOC_AUDITOR_PERSONA,
        temperature: 0.05,
        tools: [],
        displayName: DOC_AUDITOR_METADATA.displayName,
        firstName: DOC_AUDITOR_METADATA.firstName,
        lastName: DOC_AUDITOR_METADATA.lastName,
        baseRole: DOC_AUDITOR_METADATA.baseRole,
        avatar: DOC_AUDITOR_METADATA.avatar,
        provider: DOC_AUDITOR_METADATA.provider,
        model: DOC_AUDITOR_METADATA.model,
        specializations: DOC_AUDITOR_METADATA.specializations,
        lensIds: DOC_AUDITOR_METADATA.lensIds,
    }
};
