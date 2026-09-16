import type {
    IFineTuningService,
    FineTuningJob,
    FineTuningDataset,
    FineTuningHyperparams,
    FineTuningMethod,
} from '../contracts/fine-tuning';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { rootLogger } from './logger-service';
const FT_LOGGER = rootLogger.child('FineTuningService');

const STORAGE_KEY = 'fine_tuning_data';

function id(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PersistedData {
    datasets: FineTuningDataset[];
    jobs: FineTuningJob[];
}

const AVAILABLE_MODELS = [
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'groq' },
    { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'groq' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'gemini' },
    { id: 'mistral-7b', name: 'Mistral 7B', provider: 'openrouter' },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'openrouter' },
];

export class FineTuningService implements IFineTuningService {
    private datasets: FineTuningDataset[] = [];
    private jobs: FineTuningJob[] = [];
    private timers = new Map<string, ReturnType<typeof setInterval>>();
    private _initialized = false;
    private readonly apiEndpoint: string | null;

    constructor(endpoint?: string) {
        this.apiEndpoint = endpoint ?? null;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw) as PersistedData;
                this.datasets = data.datasets ?? [];
                this.jobs = data.jobs ?? [];
            }
        } catch {
            this.datasets = [];
            this.jobs = [];
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        for (const timer of this.timers.values()) clearInterval(timer);
        this.timers.clear();
        this.datasets = [];
        this.jobs = [];
    }

    private persist(): void {
        try {
            ssrSafeStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ datasets: this.datasets, jobs: this.jobs }),
            );
        } catch {
            /* silent */
        }
    }

    getDatasets(): FineTuningDataset[] {
        return this.datasets;
    }

    addDataset(dataset: Omit<FineTuningDataset, 'id' | 'createdAt'>): FineTuningDataset {
        const d: FineTuningDataset = { ...dataset, id: id(), createdAt: Date.now() };
        this.datasets.push(d);
        this.persist();
        return d;
    }

    removeDataset(id: string): void {
        this.datasets = this.datasets.filter((d) => d.id !== id);
        this.persist();
    }

    getJobs(): FineTuningJob[] {
        return this.jobs;
    }

    createJob(
        name: string,
        baseModel: string,
        method: FineTuningMethod,
        datasetId: string,
        hyperparams: FineTuningHyperparams,
    ): FineTuningJob {
        const job: FineTuningJob = {
            id: id(),
            name,
            baseModel,
            method,
            datasetId,
            hyperparams,
            status: 'queued',
            progress: 0,
            currentEpoch: 0,
            totalEpochs: hyperparams.numEpochs,
            loss: null,
            evalScore: null,
            outputModelId: null,
            createdAt: Date.now(),
            startedAt: null,
            completedAt: null,
            error: null,
        };
        this.jobs.push(job);
        this.persist();
        return job;
    }

    async startJob(jobId: string): Promise<void> {
        const job = this.jobs.find((j) => j.id === jobId);
        if (!job || job.status !== 'queued') return;

        if (this.apiEndpoint) {
            job.status = 'preparing';
            this.persist();
            try {
                const res = await fetch(`${this.apiEndpoint}/jobs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobId,
                        name: job.name,
                        baseModel: job.baseModel,
                        method: job.method,
                        datasetId: job.datasetId,
                        hyperparams: job.hyperparams,
                    }),
                });
                if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
                const result = await res.json();
                Object.assign(job, result, { status: result.status ?? 'training', error: null });
            } catch (err: unknown) {
                job.status = 'failed';
                job.error = err instanceof Error ? err.message : String(err);
            }
            this.persist();
            return;
        }

        FT_LOGGER.warn(
            'FineTuningService',
            'startJob uses @deprecated MOCK backend — simulated progress, no real training API call',
            { jobId },
        );
        job.status = 'preparing';
        job.startedAt = Date.now();
        this.persist();

        let currentEpoch = 0;
        const totalEpochs = job.totalEpochs;

        const timer = setInterval(() => {
            if (currentEpoch >= totalEpochs) {
                clearInterval(timer);
                this.timers.delete(jobId);
                job.status = 'completed';
                job.progress = 100;
                job.completedAt = Date.now();
                job.evalScore = 0.75 + Math.random() * 0.2;
                job.outputModelId = `${job.baseModel}-ft-${job.id.slice(-6)}`;
                this.persist();
                return;
            }

            job.status = 'training';
            currentEpoch++;
            job.currentEpoch = currentEpoch;
            job.progress = Math.round((currentEpoch / totalEpochs) * 100);
            job.loss = Math.max(
                0.05,
                2.0 - (currentEpoch / totalEpochs) * 1.8 + (Math.random() - 0.5) * 0.1,
            );
        }, 2000);

        this.timers.set(jobId, timer);
    }

    cancelJob(jobId: string): void {
        const job = this.jobs.find((j) => j.id === jobId);
        if (!job) return;
        const timer = this.timers.get(jobId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(jobId);
        }
        job.status = 'cancelled';
        this.persist();
    }

    removeJob(jobId: string): void {
        const timer = this.timers.get(jobId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(jobId);
        }
        this.jobs = this.jobs.filter((j) => j.id !== jobId);
        this.persist();
    }

    getAvailableBaseModels() {
        return AVAILABLE_MODELS;
    }

    getDefaultHyperparams(method: FineTuningMethod): FineTuningHyperparams {
        switch (method) {
            case 'lora':
                return {
                    learningRate: 2e-4,
                    numEpochs: 3,
                    batchSize: 8,
                    warmupSteps: 100,
                    weightDecay: 0.01,
                    loraRank: 16,
                    loraAlpha: 32,
                    loraDropout: 0.05,
                };
            case 'qlora':
                return {
                    learningRate: 1e-4,
                    numEpochs: 3,
                    batchSize: 4,
                    warmupSteps: 50,
                    weightDecay: 0.01,
                    loraRank: 8,
                    loraAlpha: 16,
                    loraDropout: 0.1,
                };
            case 'adapter':
                return {
                    learningRate: 5e-5,
                    numEpochs: 5,
                    batchSize: 16,
                    warmupSteps: 200,
                    weightDecay: 0.01,
                };
            default:
                return {
                    learningRate: 1e-5,
                    numEpochs: 3,
                    batchSize: 8,
                    warmupSteps: 100,
                    weightDecay: 0.01,
                };
        }
    }
}
