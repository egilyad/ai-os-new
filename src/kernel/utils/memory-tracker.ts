import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('MemoryTracker');

export interface EngineSizes {
    sessionContexts: number;
    sessions: number;
    budgets: number;
    memories: number;
    sessionStartTimes: number;
    sessionTimeoutTimers: number;
    sessionAbortControllers: number;
    sessionAbortControllersAgents: number;
    sessionPhaseControllers: number;
    runningSessions: number;
    preflightDone: number;
    warmCache: number;
}

export interface SyncManagerSizes {
    unsubs: number;
    initUnsubs: number;
    verdictCache: number;
    runtimeSessionId: string | null;
    activeSessionSize: number;
}

export interface AggregateSizes {
    embeddingChunks: number;
    policyRules: number;
    policyFirings: number;
    modeVersions: number;
    strategyVersions: number;
    eventBusListeners: number;
    completedSessions: number;
    liveStoreAgentEvents: number;
    liveStoreRoundEvents: number;
    liveStoreStreamingMaps: number;
    activeDebateSession: number;
}

export function logMemoryStats(
    label: string,
    engine?: EngineSizes,
    sync?: SyncManagerSizes,
    aggregate?: AggregateSizes,
): void {
    const parts: string[] = [`[${label}]`];
    if (engine) {
        parts.push(`ctx=${engine.sessionContexts}`);
        parts.push(`sess=${engine.sessions}`);
        parts.push(`bud=${engine.budgets}`);
        parts.push(`mem=${engine.memories}`);
        parts.push(`start=${engine.sessionStartTimes}`);
        parts.push(`timeout=${engine.sessionTimeoutTimers}`);
        parts.push(`abortC=${engine.sessionAbortControllers}`);
        parts.push(`abortA=${engine.sessionAbortControllersAgents}`);
        parts.push(`phaseC=${engine.sessionPhaseControllers}`);
        parts.push(`run=${engine.runningSessions}`);
        parts.push(`preflight=${engine.preflightDone}`);
        parts.push(`warm=${engine.warmCache}`);
    }
    if (sync) {
        parts.push(`unsub=${sync.unsubs}`);
        parts.push(`initUnsub=${sync.initUnsubs}`);
        parts.push(`vCache=${sync.verdictCache}`);
        parts.push(`rSess=${sync.runtimeSessionId ? 'set' : 'null'}`);
        parts.push(`actSess=${sync.activeSessionSize}B`);
    }
    if (aggregate) {
        parts.push(`embCh=${aggregate.embeddingChunks}`);
        parts.push(`polR=${aggregate.policyRules}`);
        parts.push(`polF=${aggregate.policyFirings}`);
        parts.push(`modeV=${aggregate.modeVersions}`);
        parts.push(`strV=${aggregate.strategyVersions}`);
        parts.push(`ebL=${aggregate.eventBusListeners}`);
        parts.push(`hist=${aggregate.completedSessions}`);
        parts.push(`livEv=${aggregate.liveStoreAgentEvents}`);
        parts.push(`livRd=${aggregate.liveStoreRoundEvents}`);
        parts.push(`livMp=${aggregate.liveStoreStreamingMaps}`);
        parts.push(`actSess=${aggregate.activeDebateSession}`);
    }
    LOGGER.info('MemoryTracker', parts.join(' '));
}

export function estimateSessionBytes(session: Record<string, unknown> | null): number {
    if (!session) return 0;
    try {
        const json = JSON.stringify(session);
        return json ? json.length * 2 : 0;
    } catch {
        return -1;
    }
}
