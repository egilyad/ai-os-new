import type { DebateSession } from '../../contracts/debate-types';
import type { DebateStore, DebateSessionRecord } from '../../contracts/storage/debate-store';
import { rootLogger } from '../logger-service';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('DebateSessionPersistence');

/** 1e M7: fallback with warning when topologyType not in TOPOLOGY_TO_STRATEGY */
function topologyToStrategy(topologyType: string): DebateSession['strategy'] {
    const map: Record<string, DebateSession['strategy'] | undefined> = {
        roundtable: 'round_robin',
        linear: 'sequential',
        judge: 'judge',
        'tree-of-thought': 'argument_tree',
        'red-blue': 'red-blue',
    };
    const strategy = map[topologyType];
    if (!strategy) {
        LOGGER.warn(
            'DebateSessionPersistence',
            'Unknown topology type, falling back to round_robin',
            {
                topologyType,
            },
        );
    }
    return strategy ?? 'round_robin';
}

const STRATEGY_MAP: Record<string, import('../../contracts/debate-runtime').TopologyType> = {
    round_robin: 'roundtable',
    sequential: 'linear',
    judge: 'judge',
    'tree-of-thought': 'tree-of-thought',
    'red-blue': 'red-blue',
    'cross-examination': 'roundtable',
    socratic: 'roundtable',
    tournament: 'roundtable',
    argument_tree: 'tree-of-thought',
    constrained: 'roundtable',
    moderated: 'roundtable',
    free_for_all: 'roundtable',
    jury_trial: 'judge',
};

function sessionToRecord(session: DebateSession): DebateSessionRecord {
    const extra = JSON.stringify({
        config: session.config || {},
        convergenceScore: session.convergenceScore ?? 0,
        maxRounds: session.maxRounds ?? 10,
        metadata: session.metadata ?? {},
        tags: session.tags ?? [],
    });
    return {
        id: session.id,
        topic: session.topic,
        topologyType: STRATEGY_MAP[session.strategy] ?? 'roundtable',
        phase: session.status || 'active',
        round: session.currentRound || 0,
        totalTokens: session.totalTokens ?? 0,
        totalCost: session.totalCost ?? 0,
        agentStates: JSON.stringify(
            session.arguments?.map((a) => ({
                agentId: a.agentId,
                nodeId: a.agentName,
                phase: 'idle' as const,
                round: a.round,
                tokensUsed: 0,
                latency: 0,
                lastActiveAt: a.timestamp,
            })) || [],
        ),
        arguments: JSON.stringify(session.arguments || []),
        topology: extra,
        participants: JSON.stringify(session.participants || []),
        memory: '{}',
        startedAt: session.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        createdAt: session.createdAt ?? Date.now(),
    };
}

function toNum(v: unknown, fallback: number): number {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function toBool(v: unknown, fallback: boolean): boolean {
    if (typeof v === 'boolean') return v;
    return fallback;
}

function recordToSession(record: DebateSessionRecord): DebateSession {
    const savedExtra: Record<string, unknown> =
        ((record.topology ? safeJsonParse(record.topology) : {}) as Record<string, unknown>) ?? {};
    const savedConfig =
        typeof savedExtra.config === 'object' && savedExtra.config
            ? (savedExtra.config as Record<string, unknown>)
            : ({} as Record<string, unknown>);
    let parsedParticipants: unknown;
    let parsedArgs: unknown;
    try {
        parsedParticipants = safeJsonParse(record.participants);
    } catch {
        parsedParticipants = null;
    }
    if (record.arguments) {
        try {
            parsedArgs = safeJsonParse(record.arguments);
        } catch {
            parsedArgs = null;
        }
    }
    if (!parsedArgs) {
        try {
            parsedArgs = safeJsonParse(record.agentStates || '[]');
        } catch {
            parsedArgs = null;
        }
    }
    return {
        id: record.id,
        topic: record.topic || '(untitled)',
        status: (record.phase || 'active') as DebateSession['status'],
        strategy: record.topologyType ? topologyToStrategy(record.topologyType) : 'round_robin',
        maxRounds: toNum(savedExtra.maxRounds, 10),
        currentRound: record.round,
        participants: Array.isArray(parsedParticipants) ? parsedParticipants : [],
        arguments: Array.isArray(parsedArgs) ? parsedArgs : [],
        convergenceScore: toNum(savedExtra.convergenceScore, 0),
        totalTokens: record.totalTokens,
        totalCost: record.totalCost,
        createdAt: record.createdAt,
        config: {
            roundDelayMs: toNum(savedConfig.roundDelayMs, 2000),
            maxTokens: toNum(savedConfig.maxTokens, 4096),
            temperature: toNum(savedConfig.temperature, 0.7),
            debateTemperature: toNum(savedConfig.debateTemperature, 0.7),
            useModerator: toBool(savedConfig.useModerator, false),
            timeoutMs: toNum(savedConfig.timeoutMs, 30000),
        },
    };
}

export async function loadActiveSession(debateStore: DebateStore): Promise<DebateSession | null> {
    try {
        let records = await debateStore.listSessions({ status: 'active', limit: 1 });
        if (records.length === 0) {
            records = await debateStore.listSessions({ status: 'paused', limit: 1 });
        }
        if (records.length === 0) return null;
        const record = records[0]!;
        const session = recordToSession(record);
        const zombieThreshold = 5 * 60 * 1000;
        if (session.status === 'active') {
            if (Date.now() - record.updatedAt > zombieThreshold) {
                session.status = 'failed';
                LOGGER.warn('DebateSessionPersistence', 'Zombie session detected — auto-failing', {
                    sessionId: session.id,
                    topic: session.topic,
                    age: Date.now() - record.updatedAt,
                });
                session.consensus = 'Session timed out (zombie detected on reload)';
                await debateStore.saveSnapshot(sessionToRecord(session));
                return null;
            }
            session.status = 'paused';
            await debateStore.saveSnapshot(sessionToRecord(session));
        }
        if (session.status === 'paused') return session;
    } catch (e) {
        LOGGER.warn('DebateSessionPersistence', 'Failed to load active session', {
            error: e instanceof Error ? e.message : String(e),
        });
    }
    return null;
}

export async function persistActiveSession(
    debateStore: DebateStore,
    session: DebateSession | null,
): Promise<void> {
    if (!session) return;
    try {
        await debateStore.saveSnapshot(sessionToRecord(session));
    } catch (e) {
        LOGGER.warn('DebateSessionPersistence', 'Failed to persist active session', {
            error: e instanceof Error ? e.message : String(e),
        });
    }
}

export async function loadHistoryList(
    debateStore: DebateStore,
    maxHistory: number,
): Promise<DebateSession[]> {
    try {
        const records = await debateStore.listSessions({ status: 'completed', limit: maxHistory });
        return records.map(recordToSession);
    } catch (e) {
        LOGGER.warn('DebateSessionPersistence', 'Failed to load debate history', {
            error: e instanceof Error ? e.message : String(e),
        });
    }
    return [];
}

export async function persistHistoryList(
    debateStore: DebateStore,
    sessions: DebateSession[],
): Promise<void> {
    for (const session of sessions) {
        try {
            await debateStore.saveSnapshot(sessionToRecord(session));
        } catch (e) {
            LOGGER.warn('DebateSessionPersistence', 'Failed to persist history session', {
                error: e instanceof Error ? e.message : String(e),
                sessionId: session.id,
            });
        }
    }
}
