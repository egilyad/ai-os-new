/**
 * Typed HITL interrupts (LangGraph / ChatDev / Magentic-One inspired).
 *
 * Sits above GraphService's interrupt/approve: adds per-kind Zod schemas so a
 * human payload is validated before a paused pipeline resumes. No runtime
 * dependency on a specific graph implementation.
 */
import type {
    IHitlInterruptService,
    HitlPending,
    HitlRequest,
} from '../../contracts/hitl-interrupt';
import type { ZodType } from 'zod';

let seq = 0;

export class HitlInterruptService implements IHitlInterruptService {
    private schemas = new Map<string, ZodType>();
    private waiting = new Map<string, HitlPending>();

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.waiting.clear();
    }

    registerSchema(kind: string, schema: ZodType): void {
        this.schemas.set(kind, schema);
    }

    async interrupt(runId: string, prompt: string, kind = 'default'): Promise<HitlRequest> {
        const schema = this.schemas.get(kind);
        const request: HitlRequest = {
            id: `hitl-${Date.now()}-${++seq}`,
            runId,
            prompt,
            kind,
            responseSchema: schema ? safeSchemaDescription(schema) : undefined,
        };
        this.waiting.set(request.id, { request, createdAt: Date.now() });
        return request;
    }

    async resume(
        requestId: string,
        payload: unknown,
    ): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
        const pending = this.waiting.get(requestId);
        if (!pending) return { ok: false, error: 'unknown or already-resolved interrupt' };
        const schema = this.schemas.get(pending.request.kind);
        if (!schema) {
            this.waiting.delete(requestId);
            return { ok: true, value: payload };
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return { ok: false, error: `invalid human payload: ${parsed.error.message}` };
        }
        this.waiting.delete(requestId);
        return { ok: true, value: parsed.data };
    }

    pending(): HitlPending[] {
        return [...this.waiting.values()];
    }
}

function safeSchemaDescription(schema: ZodType): Record<string, unknown> | undefined {
    try {
        const description = (schema as unknown as { description?: string }).description;
        return description ? { title: description } : undefined;
    } catch {
        return undefined;
    }
}
