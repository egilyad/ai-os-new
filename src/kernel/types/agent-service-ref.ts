/**
 * Minimal structural reference to AgentService — leaf module with zero
 * runtime imports.
 *
 * services-extras.ts → workforce-federation / topology-manager →
 * agent-service → services-extras formed a circular dependency (all edges
 * via `import type` / dynamic `import()`, which madge and
 * dependency-cruiser both follow). Both consumers only carry the service
 * in their deps object and never call methods on it, so this empty
 * structural interface breaks the cycle with no behavior change: any real
 * AgentService instance remains assignable to it.
 */

export interface IAgentServiceRef {
    readonly __agentServiceRef?: never;
}
