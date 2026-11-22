import type { ILifecycle } from './lifecycle';

export interface ReviewScore {
    overall: number;
    axes?: Record<string, number>;
    feedback?: string;
}

export interface ReviewRetryResult<T> {
    value: T;
    score: ReviewScore;
    attempts: number;
    accepted: boolean;
}

/** Generic run → review → score → retry-with-feedback loop (SWE-agent style). */
export interface IReviewRetryService extends ILifecycle {
    run<T>(opts: {
        threshold: number;
        maxAttempts: number;
        produce(feedback: string | undefined, attempt: number): Promise<T>;
        review(value: T, attempt: number): Promise<ReviewScore>;
    }): Promise<ReviewRetryResult<T>>;
}
