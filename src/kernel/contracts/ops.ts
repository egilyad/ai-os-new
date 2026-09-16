import type { ILifecycle } from './lifecycle';
import type {
    AuditEntry,
    HierarchyNode,
    McpServer,
    MissionWatch,
    MobileSession,
    PushNotification,
    SandboxKind,
    SandboxTicket,
    SkillManifest,
    ToolGrant,
} from '../types/ops-types';

export type {
    AuditEntry,
    HierarchyNode,
    McpServer,
    MissionWatch,
    MobileSession,
    PushNotification,
    SandboxKind,
    SandboxTicket,
    SkillManifest,
    ToolGrant,
} from '../types/ops-types';

/** Append-only hash-chained audit (HexorOS-style transparency). */
export interface IAuditService extends ILifecycle {
    append(actor: string, action: string, target?: string, detail?: string): Promise<AuditEntry>;
    list(limit?: number): Promise<AuditEntry[]>;
    verify(): Promise<{ ok: boolean; brokenAt?: number }>;
}

/** CEO → subordinates tree + budget caps + spend tracking. */
export interface IHierarchyService extends ILifecycle {
    createNode(input: {
        name: string;
        parentId?: string | null;
        agentId?: string;
        budgetCap?: number;
    }): Promise<HierarchyNode>;
    getNode(id: string): Promise<HierarchyNode | null>;
    tree(): Promise<HierarchyNode[]>;
    subordinates(id: string): Promise<HierarchyNode[]>;
    setBudget(id: string, cap: number): Promise<HierarchyNode>;
    recordSpend(id: string, amount: number, reason?: string): Promise<HierarchyNode>;
    removeNode(id: string): Promise<void>;
}

/** MCP as the tool standard: registry + per-agent grants + audit. */
export interface IToolGovernanceService extends ILifecycle {
    registerServer(input: { name: string; url: string; tools?: string[] }): Promise<McpServer>;
    listServers(): Promise<McpServer[]>;
    setServerEnabled(id: string, enabled: boolean): Promise<McpServer>;
    grant(agentId: string, pattern: string, allow?: boolean): Promise<ToolGrant>;
    /** Policy check: is agent allowed to call `serverId:tool`? */
    check(agentId: string, tool: string): Promise<boolean>;
    listGrants(agentId?: string): Promise<ToolGrant[]>;
}

/** Browser/Computer use via policy-gated tickets (E2B-pattern handoff). */
export interface ISandboxBrokerService extends ILifecycle {
    request(input: {
        kind: SandboxKind;
        agentId: string;
        purpose: string;
        ttlMs?: number;
    }): Promise<SandboxTicket>;
    approve(id: string): Promise<SandboxTicket>;
    deny(id: string, reason?: string): Promise<SandboxTicket>;
    markRunning(id: string): Promise<SandboxTicket>;
    complete(id: string): Promise<SandboxTicket>;
    get(id: string): Promise<SandboxTicket | null>;
    list(): Promise<SandboxTicket[]>;
}

/** Skills marketplace: manifests + install lifecycle. */
export interface ISkillMarketService extends ILifecycle {
    publish(input: {
        name: string;
        version: string;
        description: string;
        permissions?: string[];
        entry?: string;
        author?: string;
    }): Promise<SkillManifest>;
    list(): Promise<SkillManifest[]>;
    install(id: string): Promise<SkillManifest>;
    uninstall(id: string): Promise<SkillManifest>;
    exportManifest(id: string): string;
}

/** Fleet/mission monitoring: live projection over `crew/council/graph` events. */
export interface IFleetMonitorService extends ILifecycle {
    watch(kind: MissionWatch['kind'], ref: string, label?: string): Promise<MissionWatch>;
    unwatch(id: string): Promise<void>;
    list(): Promise<MissionWatch[]>;
    snapshot(): Promise<{ missions: MissionWatch[]; counts: Record<string, number> }>;
}

/** Mobile & remote access: pairing + notifications + quick HITL actions. */
export interface IMobileAccessService extends ILifecycle {
    createPairing(deviceName: string): Promise<MobileSession>;
    pair(id: string, code: string): Promise<MobileSession>;
    revoke(id: string): Promise<void>;
    listSessions(): Promise<MobileSession[]>;
    notify(input: { title: string; body: string; actionRef?: string }): Promise<PushNotification>;
    listNotifications(unreadOnly?: boolean): Promise<PushNotification[]>;
    markRead(id: string): Promise<void>;
    /** Quick HITL from phone: approve/reject a paused graph run. */
    quickApprove(runId: string): Promise<string>;
    quickReject(runId: string, reason?: string): Promise<string>;
    quickVote(sessionId: string, voterId: string, pickId: string): Promise<string>;
}
