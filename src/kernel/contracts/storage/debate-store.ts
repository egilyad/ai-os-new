export type ConclusionType =
    'consensus' | 'dominance' | 'stalemate' | 'partial_agreement' | 'inconclusive';
export type StanceResult = 'pro_wins' | 'con_wins' | 'balanced' | 'no_clear_winner';

export interface DebateSessionRecord {
    id: string;
    topic: string;
    topologyType: 'linear' | 'roundtable' | 'judge' | 'tree-of-thought' | 'red-blue';
    phase:
        | 'created'
        | 'queued'
        | 'initializing'
        | 'active'
        | 'deliberating'
        | 'consensus'
        | 'summarizing'
        | 'paused'
        | 'completed'
        | 'failed'
        | 'cancelled';
    round: number;
    totalTokens: number;
    totalCost: number;
    agentStates: string;
    arguments: string;
    topology: string;
    participants: string;
    memory: string;
    startedAt: number;
    updatedAt: number;
    createdAt: number;
    version?: number;
    tags?: string[];
    folder?: string;
    isArchived?: boolean;
    isPinned?: boolean;
}

export interface DebateVerdictRecord {
    sessionId: string;
    topic: string;
    summary: string;
    conclusionType: ConclusionType;
    stanceResult: StanceResult;
    keyArguments: string;
    reasoning: string;
    confidence: number;
    generatedAt: number;
    roundsTotal: number;
    totalTokens: number;
}

export interface DebateStore {
    /** Returns the new version number after optimistic concurrency check */
    saveSnapshot(record: DebateSessionRecord): Promise<number>;
    getSnapshot(id: string): Promise<DebateSessionRecord | null>;
    listSessions(options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<DebateSessionRecord[]>;
    listAllSessions(): Promise<DebateSessionRecord[]>;
    deleteSession(id: string): Promise<void>;
    saveVerdict(record: DebateVerdictRecord): Promise<void>;
    getVerdict(sessionId: string): Promise<DebateVerdictRecord | null>;
    count(): Promise<number>;
}
