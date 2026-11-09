import type { ILifecycle } from './lifecycle';
import type {
    A2AAgent,
    CapabilityManifest,
    CollaborationContract,
    FederationPeer,
    GatewayEnvelope,
    HandoffRecord,
    InteropProtocol,
    MarketBid,
    MarketListing,
    TrustLevel,
} from '../types/interop-types';

export type {
    A2AAgent,
    CapabilityManifest,
    CollaborationContract,
    FederationPeer,
    GatewayEnvelope,
    HandoffRecord,
    InteropProtocol,
    MarketBid,
    MarketListing,
    TrustLevel,
} from '../types/interop-types';

/** Network boundary — interop works fully offline without it (local loopback). */
export interface IInteropTransport {
    send(peer: FederationPeer, envelope: GatewayEnvelope): Promise<Record<string, unknown>>;
}

/** Wave 6.1 — A2A: discovery, advertisement, negotiation, handoff, errors. */
export interface IA2AService extends ILifecycle {
    advertise(input: {
        name: string;
        endpoint: string;
        protocols?: InteropProtocol[];
        capabilities?: string[];
        streaming?: boolean;
        trust?: TrustLevel;
        tenantId?: string;
    }): Promise<A2AAgent>;
    discover(
        filter?: { capability?: string; protocol?: InteropProtocol },
        tenantId?: string,
    ): Promise<A2AAgent[]>;
    negotiate(
        agentId: string,
        task: string,
        tenantId?: string,
    ): Promise<{ accepted: boolean; note: string }>;
    handoff(
        agentId: string,
        task: string,
        context?: Record<string, unknown>,
        tenantId?: string,
    ): Promise<HandoffRecord>;
    reportError(
        agentId: string,
        code: string,
        message: string,
        tenantId?: string,
    ): Promise<void>;
}

/** Wave 6.2/6.5 — gateway: multi-protocol ingress/egress + translation. */
export interface IGatewayService extends ILifecycle {
    ingress(input: {
        from: string;
        to: string;
        protocol: InteropProtocol;
        kind?: GatewayEnvelope['kind'];
        payload?: Record<string, unknown>;
        tenantId?: string;
    }): Promise<GatewayEnvelope>;
    translate(envelope: GatewayEnvelope, target: InteropProtocol): Promise<GatewayEnvelope>;
    recent(limit?: number): Promise<GatewayEnvelope[]>;
}

/** Wave 6.4 — federation of OS instances with trust levels. */
export interface IFederationService extends ILifecycle {
    addPeer(input: {
        name: string;
        baseUrl: string;
        trust?: TrustLevel;
        capabilities?: string[];
        tenantId?: string;
    }): Promise<FederationPeer>;
    removePeer(id: string, tenantId?: string): Promise<void>;
    listPeers(tenantId?: string): Promise<FederationPeer[]>;
    heartbeat(id: string, tenantId?: string): Promise<FederationPeer>;
    dispatch(
        peerId: string,
        task: string,
        payload?: Record<string, unknown>,
        tenantId?: string,
    ): Promise<HandoffRecord>;
    fleetView(
        tenantId?: string,
    ): Promise<{ peers: FederationPeer[]; totalCapabilities: string[] }>;
}

/** Wave 6.3 + 7.x — manifests, handoff, market, contracts, routing, topology. */
export interface ICoordinationService extends ILifecycle {
    // Manifest 2.0
    publishManifest(input: {
        agentId: string;
        displayName: string;
        capabilities?: string[];
        costPerTask?: number;
        latencyMsP50?: number;
        trust?: TrustLevel;
        protocols?: InteropProtocol[];
        streaming?: boolean;
        memoryPolicies?: string[];
        tenantId?: string;
    }): Promise<CapabilityManifest>;
    getManifest(agentId: string, tenantId?: string): Promise<CapabilityManifest | null>;

    // Cross-runtime handoff (6.6)
    handoffExternal(
        target: string,
        task: string,
        context?: Record<string, unknown>,
        tenantId?: string,
    ): Promise<HandoffRecord>;
    completeHandoff(id: string, result: string, tenantId?: string): Promise<HandoffRecord>;
    listHandoffs(tenantId?: string): Promise<HandoffRecord[]>;
    spawnSubCrew(goal: string): Promise<string>;

    // Market / auction + contract-net (7)
    openListing(
        task: string,
        mode?: MarketListing['mode'],
        askPrice?: number,
        tenantId?: string,
    ): Promise<MarketListing>;
    bid(
        listingId: string,
        bidderId: string,
        price: number,
        etaMs?: number,
        note?: string,
        tenantId?: string,
    ): Promise<MarketBid>;
    award(
        listingId: string,
        tenantId?: string,
    ): Promise<{ listing: MarketListing; winner?: MarketBid }>;

    // Capability-based routing (7.9)
    route(
        task: string,
        candidates: Array<{ agentId: string; load?: number }>,
        tenantId?: string,
    ): Promise<{
        agentId: string;
        score: number;
        reason: string;
    }>;

    // Collaboration contracts (7.11)
    proposeContract(input: {
        parties: string[];
        work: string[];
        acceptance: string[];
        budget?: number;
        timeoutMs?: number;
        tenantId?: string;
    }): Promise<CollaborationContract>;
    acceptContract(id: string, tenantId?: string): Promise<CollaborationContract>;
    completeContract(id: string, tenantId?: string): Promise<CollaborationContract>;
}
