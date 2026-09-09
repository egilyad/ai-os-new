/**
 * OpsRepository — DAL for Wave 5 (single repo, 9 tables, Dexie v27).
 *
 *   - hierarchyNodes: 'id, parentId, createdAt'
 *   - auditLog: 'id, seq, action, createdAt'
 *   - mcpServers: 'id, name, createdAt'
 *   - toolGrants: 'id, agentId, createdAt'
 *   - sandboxTickets: 'id, kind, status, agentId, createdAt'
 *   - skillManifests: 'id, name, createdAt'
 *   - missionWatches: 'id, kind, ref, createdAt'
 *   - mobileSessions: 'id, status, createdAt'
 *   - notifications: 'id, read, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    AuditEntry,
    HierarchyNode,
    McpServer,
    MissionWatch,
    MobileSession,
    PushNotification,
    SandboxTicket,
    SkillManifest,
    ToolGrant,
} from '../types/ops-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class OpsRepository {
    constructor(private db: DatabaseService) {}

    // ── Hierarchy ──
    async putNode(n: HierarchyNode): Promise<void> {
        await this.db.hierarchyNodes.put(clone(n));
    }

    async getNode(id: string): Promise<HierarchyNode | null> {
        const r = await this.db.hierarchyNodes.get(id);
        return r ? clone(r) : null;
    }

    async listNodes(): Promise<HierarchyNode[]> {
        const rows = await this.db.hierarchyNodes.toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows.map(clone);
    }

    async deleteNode(id: string): Promise<void> {
        await this.db.hierarchyNodes.delete(id);
    }

    // ── Audit ──
    async appendAudit(e: AuditEntry): Promise<void> {
        await this.db.auditLog.put(clone(e));
    }

    async listAudit(limit = 200): Promise<AuditEntry[]> {
        const total = await this.db.auditLog.count();
        const rows = await this.db.auditLog
            .orderBy('seq')
            .reverse()
            .limit(Math.min(limit, Math.max(total, 1)))
            .toArray();
        rows.reverse();
        return rows.map(clone);
    }

    async lastAuditSeq(): Promise<number> {
        const rows = await this.db.auditLog.orderBy('seq').reverse().limit(1).toArray();
        return rows.length > 0 ? (rows[0]!.seq as number) : -1;
    }

    // ── MCP ──
    async putServer(s: McpServer): Promise<void> {
        await this.db.mcpServers.put(clone(s));
    }

    async getServer(id: string): Promise<McpServer | null> {
        const r = await this.db.mcpServers.get(id);
        return r ? clone(r) : null;
    }

    async listServers(): Promise<McpServer[]> {
        return (await this.db.mcpServers.toArray()).map(clone);
    }

    async putGrant(g: ToolGrant): Promise<void> {
        await this.db.toolGrants.put(clone(g));
    }

    async listGrants(): Promise<ToolGrant[]> {
        return (await this.db.toolGrants.toArray()).map(clone);
    }

    // ── Sandbox ──
    async putTicket(t: SandboxTicket): Promise<void> {
        await this.db.sandboxTickets.put(clone(t));
    }

    async getTicket(id: string): Promise<SandboxTicket | null> {
        const r = await this.db.sandboxTickets.get(id);
        return r ? clone(r) : null;
    }

    async listTickets(): Promise<SandboxTicket[]> {
        const rows = await this.db.sandboxTickets.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Skills ──
    async putSkill(s: SkillManifest): Promise<void> {
        await this.db.skillManifests.put(clone(s));
    }

    async getSkill(id: string): Promise<SkillManifest | null> {
        const r = await this.db.skillManifests.get(id);
        return r ? clone(r) : null;
    }

    async listSkills(): Promise<SkillManifest[]> {
        const rows = await this.db.skillManifests.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Missions ──
    async putWatch(w: MissionWatch): Promise<void> {
        await this.db.missionWatches.put(clone(w));
    }

    async getWatch(id: string): Promise<MissionWatch | null> {
        const r = await this.db.missionWatches.get(id);
        return r ? clone(r) : null;
    }

    async listWatches(): Promise<MissionWatch[]> {
        const rows = await this.db.missionWatches.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async deleteWatch(id: string): Promise<void> {
        await this.db.missionWatches.delete(id);
    }

    // ── Mobile ──
    async putSession(s: MobileSession): Promise<void> {
        await this.db.mobileSessions.put(clone(s));
    }

    async getSession(id: string): Promise<MobileSession | null> {
        const r = await this.db.mobileSessions.get(id);
        return r ? clone(r) : null;
    }

    async listSessions(): Promise<MobileSession[]> {
        const rows = await this.db.mobileSessions.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async putNotification(n: PushNotification): Promise<void> {
        await this.db.notifications.put(clone(n));
    }

    async getNotification(id: string): Promise<PushNotification | null> {
        const r = await this.db.notifications.get(id);
        return r ? clone(r) : null;
    }

    async listNotifications(): Promise<PushNotification[]> {
        const rows = await this.db.notifications.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async clear(): Promise<void> {
        await this.db.notifications.clear();
        await this.db.mobileSessions.clear();
        await this.db.missionWatches.clear();
        await this.db.skillManifests.clear();
        await this.db.sandboxTickets.clear();
        await this.db.toolGrants.clear();
        await this.db.mcpServers.clear();
        await this.db.auditLog.clear();
        await this.db.hierarchyNodes.clear();
    }
}
