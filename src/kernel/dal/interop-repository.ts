/**
 * InteropRepository — DAL for Phase A (Dexie v28, 6 tables).
 *
 *   - a2aAgents: 'id, name, trust, createdAt'
 *   - fedPeers: 'id, trust, createdAt'
 *   - handoffs: 'id, target, status, createdAt'
 *   - collabContracts: 'id, status, createdAt'
 *   - marketListings: 'id, status, createdAt'
 *   - marketBids: 'id, listingId, bidderId, createdAt'
 *
 * Gateway envelopes + manifests are event-sourced via EventBus + kept in
 * memory by services (high-churn, low-value persistence); the tables above
 * hold the durable governance state.
 */
import type { DatabaseService } from '../services/database-service';
import type {
    A2AAgent,
    CollaborationContract,
    FederationPeer,
    HandoffRecord,
    MarketBid,
    MarketListing,
} from '../types/interop-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class InteropRepository {
    constructor(private db: DatabaseService) {}

    // ── A2A ──
    async putAgent(a: A2AAgent): Promise<void> {
        await this.db.a2aAgents.put(clone(a));
    }

    async getAgent(id: string, tenantId?: string): Promise<A2AAgent | null> {
        const r = await this.db.a2aAgents.get(id);
        if (!r) return null;
        if (tenantId && r.tenantId && r.tenantId !== tenantId) return null;
        return clone(r);
    }

    async listAgents(tenantId?: string): Promise<A2AAgent[]> {
        const rows = await this.db.a2aAgents.toArray();
        return rows
            .filter((a) => !tenantId || !a.tenantId || a.tenantId === tenantId)
            .map(clone);
    }

    // ── Federation ──
    async putPeer(p: FederationPeer): Promise<void> {
        await this.db.fedPeers.put(clone(p));
    }

    async getPeer(id: string, tenantId?: string): Promise<FederationPeer | null> {
        const r = await this.db.fedPeers.get(id);
        if (!r) return null;
        if (tenantId && r.tenantId && r.tenantId !== tenantId) return null;
        return clone(r);
    }

    async listPeers(tenantId?: string): Promise<FederationPeer[]> {
        const rows = await this.db.fedPeers.toArray();
        return rows
            .filter((p) => !tenantId || !p.tenantId || p.tenantId === tenantId)
            .map(clone);
    }

    async deletePeer(id: string): Promise<void> {
        await this.db.fedPeers.delete(id);
    }

    // ── Handoffs ──
    async putHandoff(h: HandoffRecord): Promise<void> {
        await this.db.handoffs.put(clone(h));
    }

    async getHandoff(id: string): Promise<HandoffRecord | null> {
        const r = await this.db.handoffs.get(id);
        return r ? clone(r) : null;
    }

    async listHandoffs(tenantId?: string): Promise<HandoffRecord[]> {
        const rows = await this.db.handoffs.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows
            .filter((h) => !tenantId || !h.tenantId || h.tenantId === tenantId)
            .map(clone);
    }

    // ── Contracts ──
    async putContract(c: CollaborationContract): Promise<void> {
        await this.db.collabContracts.put(clone(c));
    }

    async getContract(id: string): Promise<CollaborationContract | null> {
        const r = await this.db.collabContracts.get(id);
        return r ? clone(r) : null;
    }

    async listContracts(): Promise<CollaborationContract[]> {
        const rows = await this.db.collabContracts.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Market ──
    async putListing(l: MarketListing): Promise<void> {
        await this.db.marketListings.put(clone(l));
    }

    async getListing(id: string): Promise<MarketListing | null> {
        const r = await this.db.marketListings.get(id);
        return r ? clone(r) : null;
    }

    async listListings(): Promise<MarketListing[]> {
        const rows = await this.db.marketListings.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async putBid(b: MarketBid): Promise<void> {
        await this.db.marketBids.put(clone(b));
    }

    async listBids(listingId: string): Promise<MarketBid[]> {
        const rows = await this.db.marketBids.where('listingId').equals(listingId).toArray();
        rows.sort((a, b) => a.price - b.price);
        return rows.map(clone);
    }

    async clear(): Promise<void> {
        await this.db.marketBids.clear();
        await this.db.marketListings.clear();
        await this.db.collabContracts.clear();
        await this.db.handoffs.clear();
        await this.db.fedPeers.clear();
        await this.db.a2aAgents.clear();
    }
}
