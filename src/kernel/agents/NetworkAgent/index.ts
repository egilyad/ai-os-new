import { NETWORK_METADATA, NETWORK_PERSONA } from './persona';

export const NetworkAgentDefinition = {
    metadata: NETWORK_METADATA,
    persona: NETWORK_PERSONA,
    config: {
        roleName: NETWORK_METADATA.role,
        prompt: NETWORK_PERSONA,
        temperature: 0.2,
        tools: [],
        displayName: NETWORK_METADATA.displayName,
        firstName: NETWORK_METADATA.firstName,
        lastName: NETWORK_METADATA.lastName,
        baseRole: NETWORK_METADATA.baseRole,
        avatar: NETWORK_METADATA.avatar,
        provider: NETWORK_METADATA.provider,
        model: NETWORK_METADATA.model,
        specializations: NETWORK_METADATA.specializations,
        lensIds: NETWORK_METADATA.lensIds,
    }
};
