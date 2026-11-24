import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DistributedLockService } from './cross-tab-lock-service';

describe('DistributedLockService unload release (P-MED-8)', () => {
    let svc: DistributedLockService;

    beforeEach(() => {
        svc = new DistributedLockService('test-tab-1');
    });

    afterEach(() => {
        svc.destroy();
    });

    it('releases held locks on beforeunload instead of waiting out the TTL', async () => {
        const acquired = await svc.acquire('chat:s1', { maxRetries: 0 });
        expect(acquired.lock).not.toBeNull();
        expect(await svc.isLocked('chat:s1')).toBe(true);

        window.dispatchEvent(new Event('beforeunload'));
        // Best-effort async delete: poll until the row is gone.
        let owner: string | null = 'test-tab-1';
        for (let i = 0; i < 50 && owner; i++) {
            await new Promise((r) => setTimeout(r, 20));
            owner = await svc.getOwner('chat:s1');
        }
        expect(owner).toBeNull();
    });

    it('fencing token растёт при takeover и обнуляет старый владелец', async () => {
        const first = await svc.acquire('chat:s3', { ttl: 50, maxRetries: 0 });
        expect(first.lock?.fencingToken).toBeGreaterThan(0);
        await new Promise((r) => setTimeout(r, 80));

        const other = new DistributedLockService('test-tab-2');
        const takeover = await other.acquire('chat:s3', { ttl: 120_000, maxRetries: 0 });
        expect(takeover.lock).not.toBeNull();
        expect(takeover.lock!.fencingToken).toBe(first.lock!.fencingToken + 1);
        expect(await svc.isFenceValid(first.lock!)).toBe(false);
        expect(await other.isFenceValid(takeover.lock!)).toBe(true);
        await other.destroy();
    });

    it('destroy() detaches the unload listener', async () => {
        const acquired = await svc.acquire('chat:s2', { maxRetries: 0 });
        expect(acquired.lock).not.toBeNull();
        await svc.destroy();
        expect(await svc.getOwner('chat:s2')).toBeNull();
        // After destroy the service no longer tracks the lock; a late
        // unload must not throw or resurrect notifications.
        expect(() => window.dispatchEvent(new Event('beforeunload'))).not.toThrow();
    });
});
