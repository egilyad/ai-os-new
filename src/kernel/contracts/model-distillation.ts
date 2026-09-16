import type { ILifecycle } from './lifecycle';

export type DistillationMethod =
    'knowledge_distillation' | 'pruning' | 'quantization' | 'architecture_search';

export type DistillationStatus =
    'queued' | 'preparing' | 'distilling' | 'validating' | 'completed' | 'failed' | 'cancelled';

export interface DistillationConfig {
    temperature: number;
    alpha: number;
    maxSteps: number;
    targetSize: string;
    pruneRatio?: number;
    quantBits?: 4 | 8 | 16;
}

export interface DistillationJob {
    id: string;
    name: string;
    teacherModel: string;
    studentModel: string;
    method: DistillationMethod;
    config: DistillationConfig;
    status: DistillationStatus;
    progress: number;
    currentStep: number;
    teacherScore: number | null;
    studentScore: number | null;
    sizeReduction: number | null;
    speedup: number | null;
    createdAt: number;
    completedAt: number | null;
    error: string | null;
}

export interface IDistillationService extends ILifecycle {
    getJobs(): DistillationJob[];
    createJob(
        name: string,
        teacherModel: string,
        studentModel: string,
        method: DistillationMethod,
        config: DistillationConfig,
    ): DistillationJob;
    startJob(jobId: string): Promise<void>;
    cancelJob(jobId: string): void;
    removeJob(jobId: string): void;
    getTeacherModels(): { id: string; name: string; params: string }[];
    getDefaultConfig(method: DistillationMethod): DistillationConfig;
}
