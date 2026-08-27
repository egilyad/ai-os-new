import type { DebatePhase } from './contracts/debate-types';

export type InitPhase =
    'pending' | 'kernel' | 'services' | 'topology' | 'ready' | 'failed' | 'degraded';

export interface BootstrapReport {
    phase: InitPhase;
    started: number;
    completed: number;
    duration: number;
    error: string | null;
    services: { name: string; status: 'ok' | 'error' | 'skipped'; error?: string }[];
}

export const CRITICAL_SERVICES = new Set([
    'kernel',
    'configService',
    'keyService',
    'pricingService',
]);

export const RUNNING_DEBATE_PHASES = new Set<DebatePhase>([
    'initializing',
    'active',
    'deliberating',
    'consensus',
    'summarizing',
]);

/**
 * B-35: Explicit init-order tiers for LifecycleManager services.
 * Each tier is initialized sequentially; within a tier all services
 * init in parallel. startAll() follows the same tier order.
 */
export const INIT_TIERS: string[][] = [
    // Tier 0 — no deps, must init first
    ['configService', 'logger'],
    // Tier 1 — depends on configService
    ['routerConfigManager', 'eventSourcingService', 'keyService', 'pricingService'],
    // Tier 2 — depends on keyService + pricingService
    ['budgetService', 'keyStateStore', 'rotationService', 'keyVault'],
    // Tier 3 — depends on keyStateStore
    ['providerRuntimeService', 'healthScoreService', 'probeService'],
    // Tier 4 — depends on probeService + runtime
    ['groupManagerService', 'cacheService', 'policyService'],
    // Tier 5 — application services
    [
        'debateService',
        'orchestrator',
        'agentService',
        'chatService',
        'memoryOrchestrator',
        'memoryService',
        'advisorService',
        'debateKnowledgeSync',
        'contributionService',
        'cognitiveIntelligenceService',
        'pressureMapService',
    ],
    // Tier 6 — remaining (no explicit deps or self-contained)
    ['*'],
];

/**
 * Guard: check that all services in `deps` are registered in the container.
 * Uses a supplied `containerHas(name)` callback.
 */
export function checkDependencies(
    serviceName: string,
    deps: string[],
    containerHas: (name: string) => boolean,
    logWarn: (msg: string) => void,
): void {
    for (const dep of deps) {
        if (!containerHas(dep)) {
            logWarn(
                `[Bootstrap] ${serviceName} depends on '${dep}' but it is not registered — possible race condition`,
            );
        }
    }
}
