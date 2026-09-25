/**
 * Minimal structural reference to AgentService — leaf module with zero
 * runtime imports.
 *
 * services-extras.ts → workforce-federation / topology-manager →
 * agent-service → services-extras formed a circular dependency (all edges
 * via `import type` / dynamic `import()`, which madge and
 * dependency-cruiser both follow). Both consumers only carry the service
 * in their deps object and never call methods on it. The single required
 * method below exists so the interface is not a weak type (TS would reject
 * a real AgentService otherwise); any real AgentService instance remains
 * assignable to it.
 */

export interface IAgentServiceRef {
    pause(id: string): void;
}
