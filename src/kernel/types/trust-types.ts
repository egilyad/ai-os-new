/**
 * Trust & Ecosystem domain types — Roadmap Phase C (Waves 10+11).
 *
 * Capability security, dynamic trust/reputation, declarative policy engine,
 * human governance roles, provenance graph, sandbox continuum, extensions,
 * one-action bundles, multi-surface registry, declarative OS config and
 * whole-OS snapshots.
 *
 * Persistence: Dexie v30 (10 tables). Communication: EventBus (`trust:*`, `eco:*`).
 * AuditService / ToolGovernance / SandboxBroker / SkillMarket untouched.
 */

export interface CapabilityGrant {
    id: string;
    /** 'agent:xxx' or 'tool:mcp:yyy'. */
    subject: string;
    /** e.g. 'memory:write', 'tool:execute:browser', 'data:egress'. */
    capability: string;
    allow: boolean;
    createdAt: number;
}

export interface TrustScore {
    id: string;
    subject: string;
    score: number;
    interactions: number;
    updatedAt: number;
    createdAt: number;
}

export type PolicyEffect = 'allow' | 'deny' | 'require_hitl';

export interface PolicyRule {
    id: string;
    name: string;
    /** e.g. 'tool:call', 'data:egress', 'budget:spend', 'agent:spawn'. */
    action: string;
    /** Subject pattern: 'agent:*', 'agent:ceo', 'tool:*'. */
    subject: string;
    effect: PolicyEffect;
    /** Budget cap for budget:spend rules. */
    limit?: number;
    priority: number;
    enabled: boolean;
    createdAt: number;
}

export type HumanRole = 'observer' | 'approver' | 'director' | 'auditor';

export interface GovAssignment {
    id: string;
    userId: string;
    role: HumanRole;
    scope?: string;
    createdAt: number;
}

export type SandboxLevel = 'isolated' | 'restricted' | 'standard' | 'trusted';

export interface ProvenanceNode {
    id: string;
    kind: 'decision' | 'data' | 'prompt' | 'vote' | 'toolcall' | 'agent';
    label: string;
    ref?: string;
    createdAt: number;
}

export interface ProvenanceEdge {
    id: string;
    fromId: string;
    toId: string;
    relation: 'derived_from' | 'voted_by' | 'executed_by' | 'prompted_by' | 'informed_by';
    createdAt: number;
}

export interface ExtensionManifest {
    id: string;
    name: string;
    version: string;
    permissions: string[];
    entry: string;
    isolation: SandboxLevel;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

/** One-action install bundle: cards + crews + skills + memory packs. */
export interface InstallBundle {
    id: string;
    name: string;
    description?: string;
    agentCards: string[];
    crews: Array<{ name: string; process?: string }>;
    skills: string[];
    memoryPacks: Array<{ ownerId: string; content: string }>;
    installedAt?: number;
    createdAt: number;
}

export type OsSurface = 'browser' | 'terminal' | 'mobile' | 'api' | 'native';

export interface SurfaceRecord {
    id: string;
    surface: OsSurface;
    displayName: string;
    enabled: boolean;
    lastSeenAt?: number;
    createdAt: number;
}

export interface OsSnapshot {
    id: string;
    label: string;
    /** Table-name → row count + digest. */
    inventory: Array<{ table: string; count: number; digest: string }>;
    /** Exported governance/ecosystem docs (policies, roles, extensions…). */
    docs: Record<string, unknown>;
    createdAt: number;
}
