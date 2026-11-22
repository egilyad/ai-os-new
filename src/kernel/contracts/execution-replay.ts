export interface ReplayStep {
    nodeId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    timestamp: number;
}

export interface ReplayReport {
    steps: ReplayStep[];
    durationMs: number;
    /** Steps whose input does not match the previous output (broken chain). */
    brokenLinks: string[];
}

/** Replay a recorded execution trace for an agent task (CrewAI L2). */
export interface IExecutionReplayService {
    replay(steps: ReplayStep[]): ReplayReport;
    /** Rebuild the input of a step from the previous step's output. */
    chainInput(steps: ReplayStep[], index: number): Record<string, unknown>;
}
