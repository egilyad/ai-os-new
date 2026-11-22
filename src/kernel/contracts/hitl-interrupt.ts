import type { ZodType } from 'zod';
import type { ILifecycle } from './lifecycle';

export interface HitlRequest {
    id: string;
    runId: string;
    prompt: string;
    /** Which registered schema validates the resume payload. */
    kind: string;
    /** JSON-schema-ish description of the expected human payload (from Zod). */
    responseSchema?: Record<string, unknown>;
}

export interface HitlPending {
    request: HitlRequest;
    createdAt: number;
}

/** Declarative HITL interrupts with typed, validated resume payloads. */
export interface IHitlInterruptService extends ILifecycle {
    /** Register a schema for a named interrupt kind. */
    registerSchema(kind: string, schema: ZodType): void;
    /** Raise an interrupt; returns a request carrying the expected schema. */
    interrupt(runId: string, prompt: string, kind?: string): Promise<HitlRequest>;
    /** Resume with a payload validated against the registered schema. */
    resume(
        requestId: string,
        payload: unknown,
    ): Promise<{ ok: true; value: unknown } | { ok: false; error: string }>;
    pending(): HitlPending[];
}
