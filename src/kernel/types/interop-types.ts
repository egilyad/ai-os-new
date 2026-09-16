/**
 * Interop domain types — Roadmap Phase A (Wave 6 + key Wave 7 patterns).
 *
 * A2A (Google-style), universal gateway, federation, protocol translation,
 * cross-runtime handoff, market/auction, contract-net, capability routing,
 * collaboration contracts, dynamic topology.
 *
 * Persistence: Dexie v28 (6 tables). Communication: EventBus (`interop:*`,
 * `gateway:*`, `fed:*`, `handoff:*`, `market:*`, `contract:*`).
 * MCPService / WorkforceFederation / router runtimes are untouched.
 */

export type InteropProtocol = 'a2a' | 'mcp' | 'acp' | 'webhook' | 'websocket' | 'internal';

export type TrustLevel = 'untrusted' | 'known' | 'trusted' | 'internal';

/** A2A agent card (discovery + capability advertisement). */
export interface A2AAgent {
    id: string;
    name: string;
    endpoint: string;
    protocols: InteropProtocol[];
    capabilities: string[];
    streaming: boolean;
    trust: TrustLevel;
    lastSeenAt: number;
    createdAt: number;
}

/** Capability Manifest 2.0 — extends Wave 1 Agent Card with ops metadata. */
export interface CapabilityManifest {
    id: string;
    agentId: string;
    displayName: string;
    capabilities: string[];
    /** USD per 1k task-units (advisory). */
    costPerTask?: number;
    /** p50 ms latency profile (advisory). */
    latencyMsP50?: number;
    trust: TrustLevel;
    protocols: InteropProtocol[];
    streaming: boolean;
    memoryPolicies?: string[];
    version: number;
    createdAt: number;
    updatedAt: number;
}

/** Universal envelope — every external message normalizes to this. */
export interface GatewayEnvelope {
    id: string;
    from: string;
    to: string;
    protocol: InteropProtocol;
    kind: 'task' | 'result' | 'stream' | 'error' | 'handshake';
    payload: Record<string, unknown>;
    traceId?: string;
    createdAt: number;
}

export interface FederationPeer {
    id: string;
    name: string;
    baseUrl: string;
    trust: TrustLevel;
    capabilities: string[];
    lastHeartbeatAt?: number;
    createdAt: number;
}

export interface HandoffRecord {
    id: string;
    /** Where the task goes: a2a agent id, `fed:peerId` or external name. */
    target: string;
    task: string;
    context: Record<string, unknown>;
    status: 'dispatched' | 'returned' | 'failed';
    result?: string;
    traceId: string;
    createdAt: number;
    updatedAt: number;
}

/** Structured collaboration contract (Wave 7.11). */
export interface CollaborationContract {
    id: string;
    parties: string[];
    work: string[];
    acceptance: string[];
    budget?: number;
    timeoutMs?: number;
    status: 'proposed' | 'accepted' | 'completed' | 'breached';
    createdAt: number;
    updatedAt: number;
}

/** Market / auction listing (Wave 7: market + contract-net). */
export interface MarketListing {
    id: string;
    task: string;
    askPrice?: number;
    mode: 'auction' | 'contract_net';
    status: 'open' | 'awarded' | 'closed';
    createdAt: number;
    updatedAt: number;
}

export interface MarketBid {
    id: string;
    listingId: string;
    bidderId: string;
    price: number;
    etaMs?: number;
    note?: string;
    createdAt: number;
}
