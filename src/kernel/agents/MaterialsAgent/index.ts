import { MATERIALS_METADATA, MATERIALS_PERSONA } from './persona';

export const MaterialsAgentDefinition = {
    metadata: MATERIALS_METADATA,
    persona: MATERIALS_PERSONA,
    config: {
        roleName: MATERIALS_METADATA.role,
        prompt: MATERIALS_PERSONA,
        temperature: 0.3,
        tools: [],
        displayName: MATERIALS_METADATA.displayName,
        firstName: MATERIALS_METADATA.firstName,
        lastName: MATERIALS_METADATA.lastName,
        baseRole: MATERIALS_METADATA.baseRole,
        avatar: MATERIALS_METADATA.avatar,
        provider: MATERIALS_METADATA.provider,
        model: MATERIALS_METADATA.model,
        specializations: MATERIALS_METADATA.specializations,
        lensIds: MATERIALS_METADATA.lensIds,
    },
};
