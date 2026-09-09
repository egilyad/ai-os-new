import type { ILifecycle } from './lifecycle';

export type FineTuningMethod = 'full' | 'lora' | 'qlora' | 'adapter';

export type FineTuningStatus =
    'queued' | 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed' | 'cancelled';

export interface FineTuningHyperparams {
    learningRate: number;
    numEpochs: number;
    batchSize: number;
    warmupSteps: number;
    weightDecay: number;
    loraRank?: number;
    loraAlpha?: number;
    loraDropout?: number;
}

export interface FineTuningDataset {
    id: string;
    name: string;
    description: string;
    sampleCount: number;
    category: 'chat' | 'instruction' | 'code' | 'reasoning' | 'custom';
    format: 'jsonl' | 'csv' | 'hf_dataset';
    createdAt: number;
}

export interface FineTuningJob {
    id: string;
    name: string;
    baseModel: string;
    method: FineTuningMethod;
    datasetId: string;
    hyperparams: FineTuningHyperparams;
    status: FineTuningStatus;
    progress: number;
    currentEpoch: number;
    totalEpochs: number;
    loss: number | null;
    evalScore: number | null;
    outputModelId: string | null;
    createdAt: number;
    startedAt: number | null;
    completedAt: number | null;
    error: string | null;
}

export interface IFineTuningService extends ILifecycle {
    getDatasets(): FineTuningDataset[];
    addDataset(dataset: Omit<FineTuningDataset, 'id' | 'createdAt'>): FineTuningDataset;
    removeDataset(id: string): void;

    getJobs(): FineTuningJob[];
    createJob(
        name: string,
        baseModel: string,
        method: FineTuningMethod,
        datasetId: string,
        hyperparams: FineTuningHyperparams,
    ): FineTuningJob;
    startJob(jobId: string): Promise<void>;
    cancelJob(jobId: string): void;
    removeJob(jobId: string): void;

    getAvailableBaseModels(): { id: string; name: string; provider: string }[];
    getDefaultHyperparams(method: FineTuningMethod): FineTuningHyperparams;
}
