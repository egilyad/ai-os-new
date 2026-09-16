export interface EvalPrompt {
    input: string;
    expectedOutput?: string;
    metadata?: Record<string, unknown>;
}

export interface EvalRunResult {
    promptIndex: number;
    input: string;
    expectedOutput?: string;
    actualOutput: string;
    latencyMs: number;
    tokens: { input: number; output: number };
    cost: number;
    passed: boolean;
    score: number;
    error?: string;
}

export interface EvalRun {
    id: string;
    datasetId: string;
    provider: string;
    model: string;
    timestamp: number;
    results: EvalRunResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        avgLatency: number;
        avgScore: number;
        totalCost: number;
    };
}

export interface EvalDataset {
    id: string;
    name: string;
    description: string;
    prompts: EvalPrompt[];
    tags: string[];
    createdAt: number;
    updatedAt: number;
    runs: EvalRun[];
}

export interface IEvalDatasetService {
    list(): Promise<EvalDataset[]>;
    get(id: string): Promise<EvalDataset | undefined>;
    create(dataset: Omit<EvalDataset, 'id' | 'createdAt' | 'updatedAt' | 'runs'>): Promise<string>;
    update(id: string, updates: Partial<EvalDataset>): Promise<void>;
    delete(id: string): Promise<void>;
    runEval(datasetId: string, provider: string, model: string): Promise<EvalRun>;
    getRun(datasetId: string, runId: string): Promise<EvalRun | undefined>;
}
