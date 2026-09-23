/**
 * CoordinationService — Wave 6.3/6.6 + key Wave 7 patterns (additive).
 *
 * - Capability Manifest 2.0 (extends Wave 1 Agent Card metadata)
 * - Cross-runtime handoff with full audit trail
 * - Market/auction + contract-net
 * - Capability-based routing (capabilities + load + cost + trust)
 * - Structured collaboration contracts
 * - Dynamic topology + recursive teams via injected Crew/Forge delegates
 *   (Wave 7.8); P2P mesh / supervisor pools express as graph modes (Wave 3).
 */
import type { IEventBus } from '../../types/interfaces';
import type { InteropRepository } from '../../dal/interop-repository';
import type { ICoordinationService, InteropProtocol, TrustLevel } from '../../contracts/interop';
import type {
    CapabilityManifest,
    CollaborationContract,
    HandoffRecord,
    MarketBid,
    MarketListing,
} from '../../types/interop-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Coordination');

function now(): number {
    return Date.now();
}

const TRUST_SCORE: Record<TrustLevel, number> = {
    internal: 1,
    trusted: 0.8,
    known: 0.5,
    untrusted: 0,
};

export interface CoordinationDelegates {
    adaptCrew?(crewId: string, ops: Array<{ op: 'add' | 'remove'; role?: string; roleId?: string }>): Promise<string>;
    forgeSubCrew?(goal: string): Promise<string>;
}

export class CoordinationService implements ICoordinationService {
    private manifests = new Map<string, CapabilityManifest>();

    constructor(
        private repo: InteropRepository,
        private events: IEventBus,
        private delegates: CoordinationDelegates = {},
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Coordination', 'init', {});
    }

    async destroy(): Promise<void> {
        this.manifests.clear();
    }

    // ── Manifest 2.0 ──
    async publishManifest(input: {
        agentId: string;
        displayName: string;
        capabilities?: string[];
        costPerTask?: number;
        latencyMsP50?: number;
        trust?: TrustLevel;
        protocols?: InteropProtocol[];
        streaming?: boolean;
        memoryPolicies?: string[];
    }): Promise<CapabilityManifest> {
        const t = now();
        const prev = this.manifests.get(input.agentId);
        const manifest: CapabilityManifest = {
            id: prev?.id ?? genId('manifest'),
            agentId: input.agentId,
            displayName: input.displayName,
            capabilities: input.capabilities ?? prev?.capabilities ?? [],
            costPerTask: input.costPerTask ?? prev?.costPerTask,
            latencyMsP50: input.latencyMsP50 ?? prev?.latencyMsP50,
            trust: input.trust ?? prev?.trust ?? 'known',
            protocols: input.protocols ?? prev?.protocols ?? ['internal'],
            streaming: input.streaming ?? prev?.streaming ?? false,
            memoryPolicies: input.memoryPolicies ?? prev?.memoryPolicies,
            version: (prev?.version ?? 0) + 1,
            createdAt: prev?.createdAt ?? t,
            updatedAt: t,
        };
        this.manifests.set(input.agentId, manifest);
        this.events.emit(EVENTS.INTEROP_AGENT, { agentId: input.agentId, action: 'manifest-published' });
        return manifest;
    }

    async getManifest(agentId: string): Promise<CapabilityManifest | null> {
        return this.manifests.get(agentId) ?? null;
    }

    // ── Cross-runtime handoff ──
    async handoffExternal(target: string, task: string, context: Record<string, unknown> = {}): Promise<HandoffRecord> {
        const t = now();
        const record: HandoffRecord = {
            id: genId('handoff'),
            target,
            task,
            context: { ...context },
            status: 'dispatched',
            traceId: genId('trace'),
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putHandoff(record);
        this.events.emit(EVENTS.HANDOFF_DISPATCHED, { handoffId: record.id, target });
        return record;
    }

    async completeHandoff(id: string, result: string): Promise<HandoffRecord> {
        const h = await this.repo.getHandoff(id);
        if (!h) throw new Error(`Handoff not found: ${id}`);
        h.status = 'returned';
        h.result = result.slice(0, 8000);
        h.updatedAt = now();
        await this.repo.putHandoff(h);
        this.events.emit(EVENTS.HANDOFF_RETURNED, { handoffId: id });
        return h;
    }

    async listHandoffs(): Promise<HandoffRecord[]> {
        return this.repo.listHandoffs();
    }

    // ── Market / contract-net ──
    async openListing(task: string, mode: MarketListing['mode'] = 'auction', askPrice?: number): Promise<MarketListing> {
        const t = now();
        const listing: MarketListing = {
            id: genId('listing'),
            task,
            askPrice,
            mode,
            status: 'open',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putListing(listing);
        this.events.emit(EVENTS.MARKET_OPENED, { listingId: listing.id, mode });
        return listing;
    }

    async bid(listingId: string, bidderId: string, price: number, etaMs?: number, note?: string): Promise<MarketBid> {
        const listing = await this.repo.getListing(listingId);
        if (!listing) throw new Error(`Listing not found: ${listingId}`);
        if (listing.status !== 'open') throw new Error(`Listing ${listingId} is ${listing.status}`);
        const bid: MarketBid = {
            id: genId('bid'),
            listingId,
            bidderId,
            price,
            etaMs,
            note: note?.slice(0, 300),
            createdAt: now(),
        };
        await this.repo.putBid(bid);
        return bid;
    }

    async award(listingId: string): Promise<{ listing: MarketListing; winner?: MarketBid }> {
        const listing = await this.repo.getListing(listingId);
        if (!listing) throw new Error(`Listing not found: ${listingId}`);
        if (listing.status !== 'open') throw new Error(`Listing ${listingId} is ${listing.status}`);
        const bids = await this.repo.listBids(listingId);
        // Auction: lowest price wins; contract-net: lowest price among bidders
        // meeting the ask (or lowest overall when no ask set).
        const eligible =
            listing.mode === 'contract_net' && listing.askPrice !== undefined
                ? bids.filter((b) => b.price <= listing.askPrice!)
                : bids;
        const winner = (eligible.length > 0 ? eligible : bids)[0];
        listing.status = 'awarded';
        listing.updatedAt = now();
        await this.repo.putListing(listing);
        this.events.emit(EVENTS.MARKET_AWARDED, { listingId, winnerId: winner?.bidderId ?? '' });
        return { listing, winner };
    }

    // ── Capability routing ──
    async route(task: string, candidates: Array<{ agentId: string; load?: number }>): Promise<{
        agentId: string;
        score: number;
        reason: string;
    }> {
        if (candidates.length === 0) throw new Error('No routing candidates');
        const taskTokens = new Set(task.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
        let best = { agentId: candidates[0]!.agentId, score: -1, reason: '' };
        for (const c of candidates) {
            const m = this.manifests.get(c.agentId);
            const caps = m?.capabilities ?? [];
            let overlap = 0;
            for (const cap of caps) {
                for (const tok of cap.toLowerCase().split(/[^a-zа-яё0-9]+/u)) {
                    if (taskTokens.has(tok)) {
                        overlap += 1;
                        break;
                    }
                }
            }
            const capScore = caps.length > 0 ? overlap / caps.length : 0.1;
            const loadPenalty = Math.min(0.5, (c.load ?? 0) * 0.1);
            const costPenalty = m?.costPerTask ? Math.min(0.3, m.costPerTask / 10) : 0;
            const trustBonus = (m ? TRUST_SCORE[m.trust] : 0.3) * 0.3;
            const score = capScore - loadPenalty - costPenalty + trustBonus;
            if (score > best.score) {
                best = {
                    agentId: c.agentId,
                    score,
                    reason: `cap ${overlap}/${caps.length}, load ${c.load ?? 0}, trust ${m?.trust ?? 'unknown'}`,
                };
            }
        }
        return best;
    }

    // ── Collaboration contracts ──
    async proposeContract(input: {
        parties: string[];
        work: string[];
        acceptance: string[];
        budget?: number;
        timeoutMs?: number;
    }): Promise<CollaborationContract> {
        if (input.parties.length < 2) throw new Error('Contract needs at least 2 parties');
        const t = now();
        const contract: CollaborationContract = {
            id: genId('contract'),
            parties: [...input.parties],
            work: [...input.work],
            acceptance: [...input.acceptance],
            budget: input.budget,
            timeoutMs: input.timeoutMs,
            status: 'proposed',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putContract(contract);
        this.events.emit(EVENTS.CONTRACT_PROPOSED, { contractId: contract.id });
        return contract;
    }

    async acceptContract(id: string): Promise<CollaborationContract> {
        const c = await this.requireContract(id);
        if (c.status !== 'proposed') throw new Error(`Contract ${id} is ${c.status}`);
        c.status = 'accepted';
        c.updatedAt = now();
        await this.repo.putContract(c);
        return c;
    }

    async completeContract(id: string): Promise<CollaborationContract> {
        const c = await this.requireContract(id);
        if (c.status !== 'accepted') throw new Error(`Contract ${id} is ${c.status}`);
        c.status = 'completed';
        c.updatedAt = now();
        await this.repo.putContract(c);
        return c;
    }

    // ── Dynamic topology + recursive teams (Wave 7.8, via delegates) ──
    async adaptTeam(
        crewId: string,
        ops: Array<{ op: 'add' | 'remove'; role?: string; roleId?: string }>,
    ): Promise<string> {
        if (!this.delegates.adaptCrew) return `adapt-queued for ${crewId} (${ops.length} ops, no crew delegate)`;
        return this.delegates.adaptCrew(crewId, ops);
    }

    async spawnSubCrew(goal: string): Promise<string> {
        if (!this.delegates.forgeSubCrew) return `subcrew-queued: ${goal.slice(0, 120)} (no forge delegate)`;
        return this.delegates.forgeSubCrew(goal);
    }

    private async requireContract(id: string): Promise<CollaborationContract> {
        const c = await this.repo.getContract(id);
        if (!c) throw new Error(`Contract not found: ${id}`);
        return c;
    }
}
