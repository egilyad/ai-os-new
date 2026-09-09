import type { ILifecycle } from './lifecycle';
import type {
    CapabilityGrant,
    ExtensionManifest,
    GovAssignment,
    HumanRole,
    InstallBundle,
    OsSnapshot,
    OsSurface,
    PolicyEffect,
    PolicyRule,
    ProvenanceEdge,
    ProvenanceNode,
    SandboxLevel,
    SurfaceRecord,
    TrustScore,
} from '../types/trust-types';

export type {
    CapabilityGrant,
    ExtensionManifest,
    GovAssignment,
    HumanRole,
    InstallBundle,
    OsSnapshot,
    OsSurface,
    PolicyEffect,
    PolicyRule,
    ProvenanceEdge,
    ProvenanceNode,
    SandboxLevel,
    SurfaceRecord,
    TrustScore,
} from '../types/trust-types';

/** Wave 10.22–10.24 + 10.27: capabilities, trust, policies, human roles. */
export interface IGovernanceService extends ILifecycle {
    // Capabilities (least privilege)
    grantCapability(subject: string, capability: string, allow?: boolean): Promise<CapabilityGrant>;
    checkCapability(subject: string, capability: string): Promise<boolean>;
    // Trust & reputation
    feedback(subject: string, outcome: number): Promise<TrustScore>;
    trustOf(subject: string): Promise<TrustScore | null>;
    // Declarative policies
    addPolicy(input: {
        name: string;
        action: string;
        subject?: string;
        effect?: PolicyEffect;
        limit?: number;
        priority?: number;
    }): Promise<PolicyRule>;
    setPolicyEnabled(id: string, enabled: boolean): Promise<PolicyRule>;
    evaluate(input: { action: string; subject: string; amount?: number }): Promise<{
        decision: PolicyEffect;
        ruleId?: string;
    }>;
    // Human roles
    assignRole(userId: string, role: HumanRole, scope?: string): Promise<GovAssignment>;
    rolesOf(userId: string): Promise<GovAssignment[]>;
    can(userId: string, action: 'observe' | 'approve' | 'direct' | 'audit'): Promise<boolean>;
}

/** Wave 10.25 + 10.26: provenance graph + sandbox continuum. */
export interface IProvenanceService extends ILifecycle {
    addNode(kind: ProvenanceNode['kind'], label: string, ref?: string): Promise<ProvenanceNode>;
    link(fromId: string, toId: string, relation?: ProvenanceEdge['relation']): Promise<ProvenanceEdge>;
    /** Full ancestry of a decision node (BFS upstream). */
    trace(decisionId: string, depth?: number): Promise<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }>;
    sandboxLevelFor(task: string): SandboxLevel;
}

/** Wave 11: extensions, bundles, surfaces, OS config, snapshots. */
export interface IEcosystemService extends ILifecycle {
    // Extensions 2.0
    registerExtension(input: {
        name: string;
        version: string;
        permissions?: string[];
        entry?: string;
        isolation?: SandboxLevel;
    }): Promise<ExtensionManifest>;
    setExtensionEnabled(id: string, enabled: boolean): Promise<ExtensionManifest>;
    listExtensions(): Promise<ExtensionManifest[]>;
    // One-action bundles
    publishBundle(input: {
        name: string;
        description?: string;
        agentCards?: string[];
        crews?: Array<{ name: string; process?: string }>;
        skills?: string[];
        memoryPacks?: Array<{ ownerId: string; content: string }>;
    }): Promise<InstallBundle>;
    installBundle(id: string): Promise<string>;
    listBundles(): Promise<InstallBundle[]>;
    // Multi-surface OS
    registerSurface(surface: OsSurface, displayName: string): Promise<SurfaceRecord>;
    listSurfaces(): Promise<SurfaceRecord[]>;
    // Declarative config + whole-OS snapshot
    exportConfig(): Promise<Record<string, unknown>>;
    importConfig(doc: Record<string, unknown>): Promise<string[]>;
    snapshot(label: string): Promise<OsSnapshot>;
    listSnapshots(): Promise<OsSnapshot[]>;
}
