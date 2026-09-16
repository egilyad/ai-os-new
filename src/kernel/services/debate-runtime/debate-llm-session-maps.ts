// Module-level RToM graph service instances keyed by sessionId
export const sessionRToMMap = new Map<
    string,
    import('../../contracts/debate-rtom').IRToMGraphService
>();

// Module-level strategy fingerprint service instances keyed by sessionId
export const sessionFingerprintMap = new Map<
    string,
    import('../../contracts/debate-strategy-fingerprint').IStrategyFingerprintService
>();

// Module-level causal graph builder instances keyed by sessionId (P0.16)
export const sessionCausalGraphMap = new Map<
    string,
    import('../../contracts/debate-causal-graph').ICausalGraphBuilder
>();

/**
 * C1: Clean up all module-level maps for a given sessionId.
 * Must be called when a debate session ends (completed/failed/cancelled)
 * to prevent unbounded memory growth (~50-200KB per debate).
 */
export function cleanupSessionMaps(sessionId: string): void {
    sessionRToMMap.delete(sessionId);
    sessionFingerprintMap.delete(sessionId);
    sessionCausalGraphMap.delete(sessionId);
}
