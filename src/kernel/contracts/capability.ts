import type { ILifecycle } from './lifecycle';
import type { AgentDefinition, Capability, ResolvedAgent } from '../types/capability-types';
export type { AgentDefinition, Capability, ResolvedAgent } from '../types/capability-types';

export interface ICapabilityResolver extends ILifecycle {
    resolve(def: AgentDefinition): Promise<ResolvedAgent>;
    // bindings
    skillToTools(skillIds: string[]): Promise<string[]>;
    personaToPrompt(personaId?: string): Promise<string>;
    roleToPolicy(roleId: string): Promise<{ ok: boolean; reason?: string }>;
}

export interface IAgentFactory extends ILifecycle {
    create(input: Omit<AgentDefinition,'id'|'createdAt'|'updatedAt'>): Promise<AgentDefinition>;
    /** Convenient: create + resolve in one call (standard for all subsystems) */
    createResolved(input: Omit<AgentDefinition,'id'|'createdAt'|'updatedAt'>): Promise<ResolvedAgent>;
    get(id: string): Promise<AgentDefinition | null>;
    resolve(id: string): Promise<ResolvedAgent>;
    execute(id: string, task: string): Promise<{ output: string; toolCalls: string[] }>;
}
