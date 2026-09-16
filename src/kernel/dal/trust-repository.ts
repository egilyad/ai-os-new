/**
 * TrustRepository — DAL for Phase C (Dexie v30, 10 tables).
 *
 *   - capabilities: 'id, subject, capability, createdAt'
 *   - trustScores: 'id, subject, createdAt'
 *   - policyRules: 'id, action, subject, createdAt'
 *   - govRoles: 'id, userId, role, createdAt'
 *   - provenanceNodes: 'id, kind, createdAt'
 *   - provenanceEdges: 'id, fromId, toId, createdAt'
 *   - extensions: 'id, name, createdAt'
 *   - bundles: 'id, name, createdAt'
 *   - surfaces: 'id, surface, createdAt'
 *   - osSnapshots: 'id, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    CapabilityGrant,
    ExtensionManifest,
    GovAssignment,
    InstallBundle,
    OsSnapshot,
    PolicyRule,
    ProvenanceEdge,
    ProvenanceNode,
    SurfaceRecord,
    TrustScore,
} from '../types/trust-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class TrustRepository {
    constructor(private db: DatabaseService) {}

    // ── Capabilities ──
    async putCapability(g: CapabilityGrant): Promise<void> {
        await this.db.capabilities.put(clone(g));
    }

    async listCapabilities(): Promise<CapabilityGrant[]> {
        return (await this.db.capabilities.toArray()).map(clone);
    }

    // ── Trust ──
    async putTrust(t: TrustScore): Promise<void> {
        await this.db.trustScores.put(clone(t));
    }

    async getTrustBySubject(subject: string): Promise<TrustScore | null> {
        const rows = await this.db.trustScores.where('subject').equals(subject).toArray();
        return rows.length > 0 ? clone(rows[0]!) : null;
    }

    // ── Policies ──
    async putPolicy(p: PolicyRule): Promise<void> {
        await this.db.policyRules.put(clone(p));
    }

    async getPolicy(id: string): Promise<PolicyRule | null> {
        const r = await this.db.policyRules.get(id);
        return r ? clone(r) : null;
    }

    async listPolicies(): Promise<PolicyRule[]> {
        const rows = await this.db.policyRules.toArray();
        rows.sort((a, b) => b.priority - a.priority);
        return rows.map(clone);
    }

    // ── Gov roles ──
    async putRole(a: GovAssignment): Promise<void> {
        await this.db.govRoles.put(clone(a));
    }

    async listRoles(): Promise<GovAssignment[]> {
        return (await this.db.govRoles.toArray()).map(clone);
    }

    // ── Provenance ──
    async putProvNode(n: ProvenanceNode): Promise<void> {
        await this.db.provenanceNodes.put(clone(n));
    }

    async getProvNode(id: string): Promise<ProvenanceNode | null> {
        const r = await this.db.provenanceNodes.get(id);
        return r ? clone(r) : null;
    }

    async putProvEdge(e: ProvenanceEdge): Promise<void> {
        await this.db.provenanceEdges.put(clone(e));
    }

    async listProvEdges(): Promise<ProvenanceEdge[]> {
        return (await this.db.provenanceEdges.toArray()).map(clone);
    }

    // ── Extensions ──
    async putExtension(e: ExtensionManifest): Promise<void> {
        await this.db.extensions.put(clone(e));
    }

    async getExtension(id: string): Promise<ExtensionManifest | null> {
        const r = await this.db.extensions.get(id);
        return r ? clone(r) : null;
    }

    async listExtensions(): Promise<ExtensionManifest[]> {
        const rows = await this.db.extensions.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Bundles ──
    async putBundle(b: InstallBundle): Promise<void> {
        await this.db.bundles.put(clone(b));
    }

    async getBundle(id: string): Promise<InstallBundle | null> {
        const r = await this.db.bundles.get(id);
        return r ? clone(r) : null;
    }

    async listBundles(): Promise<InstallBundle[]> {
        const rows = await this.db.bundles.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Surfaces ──
    async putSurface(s: SurfaceRecord): Promise<void> {
        await this.db.surfaces.put(clone(s));
    }

    async listSurfaces(): Promise<SurfaceRecord[]> {
        return (await this.db.surfaces.toArray()).map(clone);
    }

    // ── Snapshots ──
    async putSnapshot(s: OsSnapshot): Promise<void> {
        await this.db.osSnapshots.put(clone(s));
    }

    async listSnapshots(): Promise<OsSnapshot[]> {
        const rows = await this.db.osSnapshots.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async clear(): Promise<void> {
        await this.db.osSnapshots.clear();
        await this.db.surfaces.clear();
        await this.db.bundles.clear();
        await this.db.extensions.clear();
        await this.db.provenanceEdges.clear();
        await this.db.provenanceNodes.clear();
        await this.db.govRoles.clear();
        await this.db.policyRules.clear();
        await this.db.trustScores.clear();
        await this.db.capabilities.clear();
    }
}
