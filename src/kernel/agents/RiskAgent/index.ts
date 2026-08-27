import { RISK_METADATA, RISK_PERSONA, RISK_TOOLS } from './persona';

export const RiskAgentDefinition = {
    metadata: RISK_METADATA,
    persona: RISK_PERSONA,
    tools: RISK_TOOLS,
    config: {
        roleName: RISK_METADATA.role,
        prompt: RISK_PERSONA,
        temperature: 0.15,
        tools: RISK_TOOLS,
        displayName: RISK_METADATA.displayName,
        firstName: RISK_METADATA.firstName,
        lastName: RISK_METADATA.lastName,
        baseRole: RISK_METADATA.baseRole,
        avatar: RISK_METADATA.avatar,
        provider: RISK_METADATA.provider,
        model: RISK_METADATA.model,
        specializations: RISK_METADATA.specializations,
        lensIds: RISK_METADATA.lensIds,
    }
};
