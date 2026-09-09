export type CapabilityKind = 'tool' | 'skill' | 'role' | 'persona' | 'memory' | 'policy' | 'protocol' | 'model';

export interface Capability {
    kind: CapabilityKind;
    id: string;
    // lifecycle: DISCOVER → SELECT → VALIDATE → AUTHORIZE → BIND → EXECUTE → PERSIST → OBSERVE
    validate?(): Promise<{ ok: boolean; reason?: string }>;
    authorize?(agentId: string): Promise<{ ok: boolean; reason?: string }>;
}

export interface AgentDefinition {
    id: string;
    name: string;
    roleId: string;
    personaId?: string;
    skillIds: string[];
    toolIds: string[];
    memoryScope?: string;
    model?: string;
    protocol?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ResolvedAgent {
    definition: AgentDefinition;
    prompt: string;
    tools: string[];
    model: string;
    policyOk: boolean;
}
