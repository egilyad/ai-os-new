import type { ZodType } from 'zod';
import type { ILifecycle } from './lifecycle';

export interface BuiltAgentSpec {
    id: string;
    role: string;
    prompt: string;
    model?: string;
}

export interface BuiltSwarmSpec {
    name: string;
    goal: string;
    agents: BuiltAgentSpec[];
    topology: 'sequential' | 'parallel' | 'hierarchical' | 'debate';
}

/** Natural language → validated agent team/topology spec (Swarms-style). */
export interface IAutoSwarmBuilderService extends ILifecycle {
    build(
        request: string,
    ): Promise<{ ok: true; spec: BuiltSwarmSpec } | { ok: false; error: string }>;
    /** Schema used to validate the LLM output (exposed for UI/docs). */
    schema(): ZodType;
}
