import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { HitlInterruptService } from './hitl-interrupt-service';

describe('HitlInterruptService', () => {
    it('resumes with a schema-validated payload', async () => {
        const svc = new HitlInterruptService();
        svc.registerSchema(
            'approval',
            z.object({ approve: z.boolean(), note: z.string().optional() }),
        );
        const req = await svc.interrupt('run-1', 'Approve the patch?', 'approval');
        expect(req.kind).toBe('approval');
        const res = await svc.resume(req.id, { approve: true, note: 'ok' });
        expect(res).toEqual({ ok: true, value: { approve: true, note: 'ok' } });
        expect(svc.pending()).toHaveLength(0);
    });

    it('rejects an invalid human payload and keeps the interrupt pending', async () => {
        const svc = new HitlInterruptService();
        svc.registerSchema('approval', z.object({ approve: z.boolean() }));
        const req = await svc.interrupt('run-1', 'Approve?', 'approval');
        const res = await svc.resume(req.id, { approve: 'yes' });
        expect(res.ok).toBe(false);
        expect(svc.pending()).toHaveLength(1);
        const retry = await svc.resume(req.id, { approve: true });
        expect(retry.ok).toBe(true);
    });

    it('passes through unknown interrupt kinds without a schema', async () => {
        const svc = new HitlInterruptService();
        const req = await svc.interrupt('run-1', 'Free-form input');
        expect(await svc.resume(req.id, { anything: 1 })).toEqual({
            ok: true,
            value: { anything: 1 },
        });
    });

    it('refuses to resume an unknown request', async () => {
        const svc = new HitlInterruptService();
        const res = await svc.resume('missing', {});
        expect(res).toEqual({ ok: false, error: 'unknown or already-resolved interrupt' });
    });
});
