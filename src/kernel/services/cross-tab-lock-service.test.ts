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

    it('destroy() detaches the unload listener', async () => {
        const acquired = await svc.acquire('chat:s2', { maxRetries: 0 });
        expect(acquired.lock).not.toBeNull();
        svc.destroy();
        // After destroy the service no longer tracks the lock; a late
        // unload must not throw or resurrect notifications.
        expect(() =>
            window.dispatchEvent(new Event('beforeunload')),
        ).not.toThrow();
    });
});
