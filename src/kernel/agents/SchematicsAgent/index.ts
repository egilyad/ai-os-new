import { SCHEMATICS_METADATA, SCHEMATICS_PERSONA } from './persona';

export const SchematicsAgentDefinition = {
    metadata: SCHEMATICS_METADATA,
    persona: SCHEMATICS_PERSONA,
    config: {
        roleName: SCHEMATICS_METADATA.role,
        prompt: SCHEMATICS_PERSONA,
        temperature: 0.3,
        tools: [],
        displayName: SCHEMATICS_METADATA.displayName,
        firstName: SCHEMATICS_METADATA.firstName,
        lastName: SCHEMATICS_METADATA.lastName,
        baseRole: SCHEMATICS_METADATA.baseRole,
        avatar: SCHEMATICS_METADATA.avatar,
        provider: SCHEMATICS_METADATA.provider,
        model: SCHEMATICS_METADATA.model,
        specializations: SCHEMATICS_METADATA.specializations,
        lensIds: SCHEMATICS_METADATA.lensIds,
    },
};
