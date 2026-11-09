import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { InteropRepository } from '../../dal/interop-repository';
import { A2AService } from './a2a-service';
import { FederationService } from './federation-service';
import type { IEventBus } from '../../types/interfaces';

function makeBus(): IEventBus {
    return {
        emit: () => {},
        on: () => () => undefined,
        onSafe: () => () => undefined,
        off: () => undefined,
        emitOnce: () => true,
        subscribeAll: () => () => undefined,
    } as unknown as IEventBus;
}

describe('A2A / federation multi-tenant isolation (P3-2)', () => {
    let tdb: TestDb;
    let a2a: A2AService;
    let fed: FederationService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const repo = new InteropRepository(tdb.db);
        const bus = makeBus();
        a2a = new A2AService(repo, bus);
        fed = new FederationService(repo, bus);
    });

    it('discover scopes agents by tenant and keeps global agents visible', async () => {
        await a2a.advertise({ name: 'A1', endpoint: 'e-a', capabilities: ['translate'], tenantId: 'tenant-a' });
        await a2a.advertise({ name: 'B1', endpoint: 'e-b', capabilities: ['code'], tenantId: 'tenant-b' });
        await a2a.advertise({ name: 'Global', endpoint: 'e-g', capabilities: ['notes'] });

        expect((await a2a.discover()).map((a) => a.name).sort()).toEqual(['A1', 'B1', 'Global']);
        const aOnly = await a2a.discover({}, 'tenant-a');
        expect(aOnly.map((a) => a.name).sort()).toEqual(['A1', 'Global']);
        const bOnly = await a2a.discover({}, 'tenant-b');
        expect(bOnly.map((a) => a.name).sort()).toEqual(['B1', 'Global']);
    });

    it('handoff refuses agents owned by another tenant', async () => {
        const a = await a2a.advertise({
            name: 'A1',
            endpoint: 'e-a',
            capabilities: ['translate'],
            tenantId: 'tenant-a',
        });
        await expect(a2a.handoff(a.id, 'task', {}, 'tenant-b')).rejects.toThrow(/not found/);
        const h = await a2a.handoff(a.id, 'task', {}, 'tenant-a');
        expect(h.tenantId).toBe('tenant-a');
        expect(h.target).toBe(a.id);
    });

    it('negotiate enforces tenant ownership', async () => {
        const a = await a2a.advertise({
            name: 'A1',
            endpoint: 'e-a',
            capabilities: ['translate'],
            tenantId: 'tenant-a',
        });
        await expect(a2a.negotiate(a.id, 'translate', 'tenant-b')).rejects.toThrow(/not found/);
        await expect(a2a.negotiate(a.id, 'translate', 'tenant-a')).resolves.toMatchObject({
            accepted: true,
        });
    });

    it('federation scopes peers and refuses cross-tenant dispatch', async () => {
        await fed.addPeer({ name: 'A-peer', baseUrl: 'http://a', tenantId: 'tenant-a' });
        await fed.addPeer({ name: 'B-peer', baseUrl: 'http://b', tenantId: 'tenant-b' });
        await fed.addPeer({ name: 'Global-peer', baseUrl: 'http://g' });

        const aPeers = await fed.listPeers('tenant-a');
        expect(aPeers.map((p) => p.name).sort()).toEqual(['A-peer', 'Global-peer']);

        const bPeer = (await fed.listPeers('tenant-b')).find((p) => p.name === 'B-peer')!;
        await expect(fed.dispatch(bPeer.id, 'task', {}, 'tenant-a')).rejects.toThrow(/not found/);
        await expect(fed.removePeer(bPeer.id, 'tenant-a')).rejects.toThrow(/not found/);

        const aPeer = (await fed.listPeers('tenant-a')).find((p) => p.name === 'A-peer')!;
        const handoff = await fed.dispatch(aPeer.id, 'task', {}, 'tenant-a');
        expect(handoff.tenantId).toBe('tenant-a');
        expect(handoff.target).toBe(`fed:${aPeer.id}`);
    });
});
