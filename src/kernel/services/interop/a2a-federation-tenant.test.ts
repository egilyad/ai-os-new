import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { InteropRepository } from '../../dal/interop-repository';
import { A2AService } from './a2a-service';
import { FederationService } from './federation-service';
import { CoordinationService } from './coordination-service';
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
    let coord: CoordinationService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        const repo = new InteropRepository(tdb.db);
        const bus = makeBus();
        a2a = new A2AService(repo, bus);
        fed = new FederationService(repo, bus);
        coord = new CoordinationService(repo, bus);
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

    it('coordination scopes manifests, listings and contracts by tenant', async () => {
        await coord.publishManifest({
            agentId: 'a1',
            displayName: 'A1',
            capabilities: ['translate'],
            tenantId: 'tenant-a',
        });
        await coord.publishManifest({
            agentId: 'b1',
            displayName: 'B1',
            capabilities: ['code'],
            tenantId: 'tenant-b',
        });
        await coord.publishManifest({
            agentId: 'g1',
            displayName: 'G1',
            capabilities: ['notes'],
        });

        expect((await coord.getManifest('a1', 'tenant-b'))).toBeNull();
        expect((await coord.getManifest('a1', 'tenant-a'))?.displayName).toBe('A1');
        expect((await coord.getManifest('g1', 'tenant-a'))?.displayName).toBe('G1');

        const routeA = await coord.route('translate please', [{ agentId: 'a1' }, { agentId: 'b1' }], 'tenant-a');
        expect(routeA.agentId).toBe('a1');

        const listing = await coord.openListing('task', 'auction', undefined, 'tenant-a');
        await expect(coord.bid(listing.id, 'bidder', 1, undefined, undefined, 'tenant-b')).rejects.toThrow(
            /not found/,
        );
        await coord.bid(listing.id, 'bidder', 1, undefined, undefined, 'tenant-a');
        const award = await coord.award(listing.id, 'tenant-a');
        expect(award.listing.status).toBe('awarded');
        await expect(coord.award(listing.id, 'tenant-b')).rejects.toThrow(/not found/);

        const contract = await coord.proposeContract({
            parties: ['x', 'y'],
            work: ['w'],
            acceptance: ['ok'],
            tenantId: 'tenant-a',
        });
        await expect(coord.acceptContract(contract.id, 'tenant-b')).rejects.toThrow(/not found/);
        const accepted = await coord.acceptContract(contract.id, 'tenant-a');
        expect(accepted.status).toBe('accepted');
        await coord.completeContract(contract.id, 'tenant-a');
        await expect(coord.completeContract(contract.id, 'tenant-b')).rejects.toThrow(/not found/);
    });
});
