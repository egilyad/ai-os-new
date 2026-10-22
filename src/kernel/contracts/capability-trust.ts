/**
 * Capability trust — how much we believe a capability of the system.
 *
 * The distinction matters for an assistant that talks to operators: a
 * capability can be
 *   - declared   — the documentation says it exists;
 *   - discovered — the implementation was found in the code;
 *   - verified   — it was actually executed and the result was observed.
 *
 * Trust only moves forward. A capability that stops working does not fall
 * back to "declared" silently — it is marked stale, so the history stays
 * honest.
 */
export type CapabilityTrust = 'declared' | 'discovered' | 'verified';

export type CapabilityKind = 'panel' | 'tool' | 'action' | 'service' | 'feature' | 'agent';

export interface CapabilityRecord {
    /** Stable id: `action:ui.openPanel`, `panel:memory`, `tool:t-read-file`. */
    id: string;
    kind: CapabilityKind;
    title: string;
    trust: CapabilityTrust;
    /** What proves the current level (file, route, executed evidence). */
    evidence: string[];
    /** True when a previously verified capability stopped working. */
    stale: boolean;
    updatedAt: number;
    /** How often it was executed and observed. */
    verifications: number;
}

export interface CapabilityTrustFilter {
    kind?: CapabilityKind;
    trust?: CapabilityTrust;
    includeStale?: boolean;
}

export interface CapabilityTrustStats {
    total: number;
    declared: number;
    discovered: number;
    verified: number;
    stale: number;
}

const ORDER: Record<CapabilityTrust, number> = {
    declared: 0,
    discovered: 1,
    verified: 2,
};

export function canPromote(from: CapabilityTrust, to: CapabilityTrust): boolean {
    return ORDER[to] > ORDER[from];
}
