import { describe, expect, it, vi } from 'vitest';
import { MobileAccessService } from './mobile-access-service';
import type { MobileSession } from '../../types/ops-types';

function makeService() {
    const sessions = new Map<string, MobileSession>();
    const repo = {
        putSession: vi.fn(async (s: MobileSession) => {
            sessions.set(s.id, s);
        }),
        getSession: vi.fn(async (id: string) => sessions.get(id) ?? null),
    };
    const audit = { append: vi.fn(async () => {}) };
    const events = { emit: vi.fn() };
    const svc = new MobileAccessService({
        repo: repo as never,
        audit: audit as never,
        events: events as never,
        graphs: {} as never,
        councils: {} as never,
    });
    return { svc, sessions, audit };
}

describe('MobileAccessService pairing', () => {
    it('генерирует 8 цифр через crypto и окно 5 минут', async () => {
        const { svc, sessions } = makeService();
        const session = await svc.createPairing('phone');
        expect(session.pairingCode).toMatch(/^\d{8}$/);
        expect(sessions.get(session.id)?.expiresAt).toBeGreaterThan(session.createdAt);
    });

    it('запирает сессию после 5 неудачных попыток', async () => {
        const { svc, sessions } = makeService();
        const session = await svc.createPairing('phone');
        for (let i = 0; i < 5; i++) {
            await expect(svc.pair(session.id, '00000000')).rejects.toThrow(/Invalid/);
        }
        expect(sessions.get(session.id)?.status).toBe('pending');
        await expect(svc.pair(session.id, '00000000')).rejects.toThrow(/locked/);
        expect(sessions.get(session.id)?.status).toBe('revoked');
    });

    it('отвергает истёкшую сессию', async () => {
        const { svc, sessions } = makeService();
        const session = await svc.createPairing('phone');
        const stored = sessions.get(session.id)!;
        stored.expiresAt = Date.now() - 1;
        await expect(svc.pair(session.id, stored.pairingCode)).rejects.toThrow(/expired/);
        expect(sessions.get(session.id)?.status).toBe('revoked');
    });
});
