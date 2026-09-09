/**
 * Ops domain types — Roadmap Wave 5 (governance, tools, observability, mobile).
 *
 * Additive layer reusing Budget/Timeline/Skills/MCP/Sandbox services
 * (none of them modified). Audit log is hash-chained (HexorOS-style
 * transparency): every governance action appends an entry.
 *
 * Persistence: Dexie v27 (9 tables). Communication: EventBus (`ops:*`).
 */

export interface HierarchyNode {
    id: string;
    name: string;
    /** Parent node id (null = CEO/root). */
    parentId: string | null;
    /** Linked agent/role id. */
    agentId?: string;
    /** Monthly budget cap in USD (undefined = inherit). */
    budgetCap?: number;
    spent: number;
    createdAt: number;
    updatedAt: number;
}

export interface AuditEntry {
    id: string;
    seq: number;
    actor: string;
    action: string;
    target?: string;
    detail?: string;
    prevHash: string;
    hash: string;
    createdAt: number;
}

export interface McpServer {
    id: string;
    name: string;
    url: string;
    tools: string[];
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface ToolGrant {
    id: string;
    agentId: string;
    /** `serverId:tool` or `serverId:*`. */
    pattern: string;
    allow: boolean;
    createdAt: number;
}

export type SandboxKind = 'browser' | 'computer' | 'code';

export type SandboxStatus = 'requested' | 'approved' | 'running' | 'done' | 'denied' | 'expired';

export interface SandboxTicket {
    id: string;
    kind: SandboxKind;
    agentId: string;
    purpose: string;
    status: SandboxStatus;
    ttlMs: number;
    createdAt: number;
    updatedAt: number;
}

export interface SkillManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    permissions: string[];
    entry: string;
    author?: string;
    installed: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface MissionWatch {
    id: string;
    /** crew / council / graph run ref. */
    kind: 'crew' | 'council' | 'graph';
    ref: string;
    label: string;
    status: string;
    lastEvent?: string;
    updatedAt: number;
    createdAt: number;
}

export interface MobileSession {
    id: string;
    deviceName: string;
    pairingCode: string;
    /** 'pending' | 'paired' | 'revoked' */
    status: 'pending' | 'paired' | 'revoked';
    createdAt: number;
    updatedAt: number;
}

export interface PushNotification {
    id: string;
    title: string;
    body: string;
    /** Quick HITL action ref, e.g. 'graph:runId' or 'council:sessionId'. */
    actionRef?: string;
    read: boolean;
    createdAt: number;
}
