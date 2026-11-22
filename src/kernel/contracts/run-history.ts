export interface RunHistoryStep {
    nodeId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    timestamp: number;
}

export interface RunHistoryArtifact {
    nodeId: string;
    type: string;
    content: string;
    createdAt: number;
}

export interface RunHistoryRecord {
    runId: string;
    goal: string;
    status: 'completed' | 'failed';
    startedAt: number;
    finishedAt: number;
    steps: RunHistoryStep[];
    artifacts: RunHistoryArtifact[];
}

/** Persistent per-run execution history. Read-only for consumers (replay/panels). */
export interface IRunHistoryService {
    save(record: RunHistoryRecord): Promise<void>;
    get(runId: string): Promise<RunHistoryRecord | null>;
    list(): Promise<RunHistoryRecord[]>;
}
