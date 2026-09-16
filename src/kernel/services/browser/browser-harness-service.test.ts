/**
 * BrowserHarnessService static test (G6) — fake DAL + fake ComputerService.
 * Verifies: strict schemas, handoff artifact, BLOCKED note, policy.
 */

import { describe, it, expect } from 'vitest';
import { BrowserHarnessService } from './browser-harness-service';

function fakeDal() {
    const store = new Map<string, unknown>();
    return {
        kv: {
            get: async (k: string) => store.get(k) ?? null,
            set: async (k: string, v: unknown) => { store.set(k, v); },
            _store: store,
        },
    } as unknown as import('../../dal/types').DataAccessLayer & { kv: { _store: Map<string, unknown> } };
}

function fakeComputer(handoff = true) {
    return {
        act: async (ticketId: string, action: string) => {
            if (handoff) return `handoff: ${action} (no approved computer ticket ${ticketId})`;
            return `queued ${action} on ticket ${ticketId}`;
        },
    } as unknown as import('../../contracts/rivals5').IComputerService;
}

function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G6 BrowserHarnessService (static)', () => {
    it('strict schemas: click_at, type_text, browser_navigate', async () => {
        const dal = fakeDal();
        const svc = new BrowserHarnessService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, computer: fakeComputer(), events: fakeBus() });
        await svc.init();
        // click_at ok
        const a1 = await svc.act('t1', 'click_at', { x: 100, y: 200 });
        expect(a1.action).toBe('click_at');
        expect(a1.status).toBe('handoff');
        expect(a1.logs.some((l) => l.includes('BLOCKED-RUNTIME'))).toBe(true);
        // click_at bad
        await expect(svc.act('t1', 'click_at', { x: 2000, y: 0 })).rejects.toThrow(/0\.\.1000/);
        // type_text sensitive
        await expect(svc.act('t1', 'type_text', { text: 'my password is 123' })).rejects.toThrow(/sensitive/);
        // browser_navigate bad scheme
        await expect(svc.act('t1', 'browser_navigate', { url: 'ftp://x' })).rejects.toThrow(/https/);
        // unknown action
        await expect(svc.act('t1', 'unknown_act', {})).rejects.toThrow(/Unknown browser action/);
        await svc.destroy();
    });

    it('artifact capture + list', async () => {
        const dal = fakeDal();
        const svc = new BrowserHarnessService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, computer: fakeComputer(false), events: fakeBus() });
        await svc.init();
        const art = await svc.act('t2', 'open_url', { url: 'https://example.com' });
        expect(art.status).toBe('queued');
        const fetched = await svc.artifact(art.id);
        expect(fetched?.id).toBe(art.id);
        const list = await svc.list('t2');
        expect(list.length).toBe(1);
        await svc.destroy();
    });

    it('policy maxTextLen + blockedPatterns', async () => {
        const dal = fakeDal();
        const svc = new BrowserHarnessService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, computer: fakeComputer(), events: fakeBus() });
        await svc.init();
        svc.setPolicy({ maxTextLen: 5 });
        expect(svc.getPolicy().maxTextLen).toBe(5);
        await expect(svc.act('t1', 'type_text', { text: '123456' })).rejects.toThrow(/too long/);
        svc.setPolicy({ maxTextLen: 2000, blockedPatterns: [/secret/i] });
        await expect(svc.act('t1', 'type_text', { text: 'my SECRET' })).rejects.toThrow(/secret/i);
        await svc.destroy();
    });

    it('handoff vs queued status', async () => {
        const dal = fakeDal();
        const handoffSvc = new BrowserHarnessService({ dal: dal as unknown as import('../../dal/types').DataAccessLayer, computer: fakeComputer(true), events: fakeBus() });
        await handoffSvc.init();
        const h = await handoffSvc.act('t-handoff', 'screenshot', {});
        expect(h.status).toBe('handoff');
        expect(h.handoffReason).toContain('handoff');
        await handoffSvc.destroy();

        const dal2 = fakeDal();
        const queuedSvc = new BrowserHarnessService({ dal: dal2 as unknown as import('../../dal/types').DataAccessLayer, computer: fakeComputer(false), events: fakeBus() });
        await queuedSvc.init();
        const q = await queuedSvc.act('t-queued', 'screenshot', {});
        expect(q.status).toBe('queued');
        await queuedSvc.destroy();
    });
});
