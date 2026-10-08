import { PATENT_METADATA, PATENT_PERSONA } from './persona';

export const PatentAgentDefinition = {
    metadata: PATENT_METADATA,
    persona: PATENT_PERSONA,
    config: {
        roleName: PATENT_METADATA.role,
        prompt: PATENT_PERSONA,
        temperature: 0.1,
        tools: [],
        displayName: PATENT_METADATA.displayName,
        firstName: PATENT_METADATA.firstName,
        lastName: PATENT_METADATA.lastName,
        baseRole: PATENT_METADATA.baseRole,
        avatar: PATENT_METADATA.avatar,
        provider: PATENT_METADATA.provider,
        model: PATENT_METADATA.model,
        specializations: PATENT_METADATA.specializations,
        lensIds: PATENT_METADATA.lensIds,
    },
};
