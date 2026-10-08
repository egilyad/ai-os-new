import { THERMODYNAMICS_METADATA, THERMODYNAMICS_PERSONA } from './persona';

export const ThermodynamicsAgentDefinition = {
    metadata: THERMODYNAMICS_METADATA,
    persona: THERMODYNAMICS_PERSONA,
    config: {
        roleName: THERMODYNAMICS_METADATA.role,
        prompt: THERMODYNAMICS_PERSONA,
        temperature: 0.3,
        tools: [],
        displayName: THERMODYNAMICS_METADATA.displayName,
        firstName: THERMODYNAMICS_METADATA.firstName,
        lastName: THERMODYNAMICS_METADATA.lastName,
        baseRole: THERMODYNAMICS_METADATA.baseRole,
        avatar: THERMODYNAMICS_METADATA.avatar,
        provider: THERMODYNAMICS_METADATA.provider,
        model: THERMODYNAMICS_METADATA.model,
        specializations: THERMODYNAMICS_METADATA.specializations,
        lensIds: THERMODYNAMICS_METADATA.lensIds,
    },
};
