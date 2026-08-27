import type {
    IDistillationService,
    DistillationJob,
    DistillationMethod,
    DistillationConfig,
} from '../contracts/model-distillation';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { rootLogger } from './logger-service';
const MD_LOGGER = rootLogger.child('DistillationService');

const STORAGE_KEY = 'distillation_data';

function id(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Persisted {
    jobs: DistillationJob[];
}

const TEACHER_MODELS = [
    { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', params: '70B' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', params: '8B' },
    { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', params: '141B' },
    { id: 'gemini-3-pro', name: 'Gemini 3 Pro', params: '—' },
];

const STUDENT_ARCHITECTURES = [
    { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', params: '1B' },
    { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', params: '3B' },
    { id: 'tiny-llama', name: 'TinyLlama 1.1B', params: '1.1B' },
    { id: 'smollm-360m', name: 'SmolLM 360M', params: '360M' },
    { id: 'phi-2', name: 'Phi-2 2.7B', params: '2.7B' },
    { id: 'qwen-0.5b', name: 'Qwen 0.5B', params: '0.5B' },
];

/**
 * @deprecated MOCK — simulated backend. Replace with real implementation before production use.
 */
export class DistillationService implements IDistillationService {
    private jobs: DistillationJob[] = [];
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
                const data = JSON.parse(raw) as Persisted;
                this.jobs = data.jobs ?? [];
            }
        } catch {
            this.jobs = [];
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        for (const t of this.timers.values()) clearInterval(t);
        this.timers.clear();
        this.jobs = [];
    }

    private persist(): void {
        try {
            ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs: this.jobs }));
        } catch {
            /* non-critical — storage write failed */
        }
    }

    getJobs(): DistillationJob[] {
        return this.jobs;
    }

    createJob(
        name: string,
        teacherModel: string,
        studentModel: string,
        method: DistillationMethod,
        config: DistillationConfig,
    ): DistillationJob {
        const job: DistillationJob = {
            id: id(),
            name,
            teacherModel,
            studentModel,
            method,
            config,
            status: 'queued',
            progress: 0,
            currentStep: 0,
            teacherScore: null,
            studentScore: null,
            sizeReduction: null,
            speedup: null,
            createdAt: Date.now(),
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
                        teacherModel: job.teacherModel,
                        studentModel: job.studentModel,
                        method: job.method,
                        config: job.config,
                    }),
                });
                if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
                const result = await res.json();
                Object.assign(job, result, { status: result.status ?? 'distilling', error: null });
            } catch (err: unknown) {
                job.status = 'failed';
                job.error = err instanceof Error ? err.message : String(err);
            }
            this.persist();
            return;
        }

        MD_LOGGER.warn(
            'DistillationService',
            'startJob uses @deprecated MOCK backend — simulated progress, no real distillation API call',
            { jobId },
        );
        job.status = 'preparing';
        this.persist();

        const totalSteps = job.config.maxSteps;
        let step = 0;

        const timer = setInterval(() => {
            if (step >= totalSteps) {
                clearInterval(timer);
                this.timers.delete(jobId);
                job.status = 'completed';
                job.progress = 100;
                job.completedAt = Date.now();
                job.teacherScore = 0.82 + Math.random() * 0.15;
                job.studentScore = job.teacherScore * (0.85 + Math.random() * 0.1);
                job.sizeReduction = job.method === 'quantization' ? 4 : 2 + Math.random() * 3;
                job.speedup = job.method === 'quantization' ? 3 : 1.5 + Math.random() * 2;
                this.persist();
                return;
            }

            job.status = step < totalSteps * 0.8 ? 'distilling' : 'validating';
            step++;
            job.currentStep = step;
            job.progress = Math.round((step / totalSteps) * 100);
        }, 1500);

        this.timers.set(jobId, timer);
    }

    cancelJob(jobId: string): void {
        const job = this.jobs.find((j) => j.id === jobId);
        if (!job) return;
        const t = this.timers.get(jobId);
        if (t) {
            clearInterval(t);
            this.timers.delete(jobId);
        }
        job.status = 'cancelled';
        this.persist();
    }

    removeJob(jobId: string): void {
        const t = this.timers.get(jobId);
        if (t) {
            clearInterval(t);
            this.timers.delete(jobId);
        }
        this.jobs = this.jobs.filter((j) => j.id !== jobId);
        this.persist();
    }

    getTeacherModels() {
        return TEACHER_MODELS;
    }

    getStudentArchitectures() {
        return STUDENT_ARCHITECTURES;
    }

    getDefaultConfig(method: DistillationMethod): DistillationConfig {
        switch (method) {
            case 'knowledge_distillation':
                return { temperature: 4.0, alpha: 0.5, maxSteps: 10000, targetSize: '3B' };
            case 'pruning':
                return {
                    temperature: 1.0,
                    alpha: 0.3,
                    maxSteps: 5000,
                    targetSize: '1B',
                    pruneRatio: 0.4,
                };
            case 'quantization':
                return {
                    temperature: 1.0,
                    alpha: 0.2,
                    maxSteps: 3000,
                    targetSize: '1B',
                    quantBits: 8,
                };
            default:
                return { temperature: 2.0, alpha: 0.5, maxSteps: 8000, targetSize: '3B' };
        }
    }
}
