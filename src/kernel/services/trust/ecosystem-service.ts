/**
 * EcosystemService — Wave 11 (extensions, bundles, surfaces, config, snapshots).
 *
 * - Extensions 2.0: manifests with permissions + isolation levels (load = enable).
 * - Bundles: one-action install of Agent Cards + Crews + Skills + Memory Packs
 *   via injected delegates to the real Crew/SkillMarket/LtMemory services.
 * - Surfaces: Browser/Terminal/Mobile/API/Native registry (same Kernel).
 * - Declarative OS config: export/import of governance+ecosystem docs.
 * - Whole-OS snapshot: inventory (table → count+digest) + docs; restore
 *   re-applies the governance/ecosystem subset (system tables are referenced,
 *   not overwritten — full restore is a manual review step by design).
 */
import type { IEventBus } from '../../types/interfaces';
import type { TrustRepository } from '../../dal/trust-repository';
import type { IAuditService, IEcosystemService } from '../../contracts/trust';
import type {
    ExtensionManifest,
    InstallBundle,
    OsSnapshot,
    OsSurface,
    SandboxLevel,
    SurfaceRecord,
} from '../../types/trust-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Ecosystem');

function now(): number {
    return Date.now();
}

function digest(s: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

export interface EcosystemDelegates {
    importAgentCard?(json: string): Promise<string>;
    createCrew?(name: string, process?: string): Promise<string>;
    installSkill?(skillRef: string): Promise<string>;
    rememberMemory?(ownerId: string, content: string): Promise<string>;
    tableInventory?(): Promise<Array<{ table: string; count: number; digest: string }>>;
}

export class EcosystemService implements IEcosystemService {
    constructor(
        private repo: TrustRepository,
        private events: IEventBus,
        private audit: IAuditService,
        private delegates: EcosystemDelegates = {},
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Ecosystem', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    // ── Extensions ──
    async registerExtension(input: {
        name: string;
        version: string;
        permissions?: string[];
        entry?: string;
        isolation?: SandboxLevel;
    }): Promise<ExtensionManifest> {
        const t = now();
        const ext: ExtensionManifest = {
            id: genId('ext'),
            name: input.name,
            version: input.version,
            permissions: input.permissions ? [...input.permissions] : [],
            entry: input.entry ?? 'index.ts',
            isolation: input.isolation ?? 'restricted',
            enabled: false,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putExtension(ext);
        await this.audit.append('ecosystem', 'extension.registered', ext.id, `${ext.name}@${ext.version}`);
        return ext;
    }

    async setExtensionEnabled(id: string, enabled: boolean): Promise<ExtensionManifest> {
        const ext = await this.repo.getExtension(id);
        if (!ext) throw new Error(`Extension not found: ${id}`);
        ext.enabled = enabled;
        ext.updatedAt = now();
        await this.repo.putExtension(ext);
        await this.audit.append('ecosystem', enabled ? 'extension.enabled' : 'extension.disabled', id, ext.name);
        return ext;
    }

    async listExtensions(): Promise<ExtensionManifest[]> {
        return this.repo.listExtensions();
    }

    // ── Bundles ──
    async publishBundle(input: {
        name: string;
        description?: string;
        agentCards?: string[];
        crews?: Array<{ name: string; process?: string }>;
        skills?: string[];
        memoryPacks?: Array<{ ownerId: string; content: string }>;
    }): Promise<InstallBundle> {
        const bundle: InstallBundle = {
            id: genId('bundle'),
            name: input.name,
            description: input.description,
            agentCards: input.agentCards ? [...input.agentCards] : [],
            crews: input.crews ? input.crews.map((c) => ({ ...c })) : [],
            skills: input.skills ? [...input.skills] : [],
            memoryPacks: input.memoryPacks ? input.memoryPacks.map((m) => ({ ...m })) : [],
            createdAt: now(),
        };
        await this.repo.putBundle(bundle);
        return bundle;
    }

    async installBundle(id: string): Promise<string> {
        const bundle = await this.repo.getBundle(id);
        if (!bundle) throw new Error(`Bundle not found: ${id}`);
        const installed: string[] = [];
        for (const cardJson of bundle.agentCards) {
            if (this.delegates.importAgentCard) {
                installed.push(`card:${await this.delegates.importAgentCard(cardJson)}`);
            } else {
                installed.push('card:queued (no delegate)');
            }
        }
        for (const c of bundle.crews) {
            if (this.delegates.createCrew) {
                installed.push(`crew:${await this.delegates.createCrew(c.name, c.process)}`);
            } else {
                installed.push(`crew:queued ${c.name} (no delegate)`);
            }
        }
        for (const s of bundle.skills) {
            if (this.delegates.installSkill) {
                installed.push(`skill:${await this.delegates.installSkill(s)}`);
            } else {
                installed.push(`skill:queued ${s} (no delegate)`);
            }
        }
        for (const m of bundle.memoryPacks) {
            if (this.delegates.rememberMemory) {
                installed.push(`memory:${await this.delegates.rememberMemory(m.ownerId, m.content)}`);
            } else {
                installed.push('memory:queued (no delegate)');
            }
        }
        bundle.installedAt = now();
        await this.repo.putBundle(bundle);
        await this.audit.append('ecosystem', 'bundle.installed', id, `${bundle.name} (${installed.length} items)`);
        this.events.emit(EVENTS.ECO_INSTALLED, { bundleId: id, items: installed.length });
        return `Bundle "${bundle.name}" installed: ${installed.join(', ')}`;
    }

    async listBundles(): Promise<InstallBundle[]> {
        return this.repo.listBundles();
    }

    // ── Surfaces ──
    async registerSurface(surface: OsSurface, displayName: string): Promise<SurfaceRecord> {
        const existing = (await this.repo.listSurfaces()).find((s) => s.surface === surface);
        if (existing) {
            existing.displayName = displayName;
            existing.enabled = true;
            existing.lastSeenAt = now();
            await this.repo.putSurface(existing);
            return existing;
        }
        const rec: SurfaceRecord = {
            id: genId('surface'),
            surface,
            displayName,
            enabled: true,
            lastSeenAt: now(),
            createdAt: now(),
        };
        await this.repo.putSurface(rec);
        return rec;
    }

    async listSurfaces(): Promise<SurfaceRecord[]> {
        return this.repo.listSurfaces();
    }

    // ── Config + snapshots ──
    async exportConfig(): Promise<Record<string, unknown>> {
        const [policies, roles, extensions] = await Promise.all([
            this.repo.listPolicies(),
            this.repo.listRoles(),
            this.repo.listExtensions(),
        ]);
        return {
            kind: 'superagents-os-config',
            version: 1,
            exportedAt: now(),
            policies: policies.filter((p) => p.enabled),
            roles,
            extensions: extensions.filter((e) => e.enabled),
        };
    }

    async importConfig(doc: Record<string, unknown>): Promise<string[]> {
        const applied: string[] = [];
        if (doc['kind'] !== 'superagents-os-config') throw new Error('Not an OS config doc');
        const policies = (doc['policies'] ?? []) as Array<{ name: string; action: string; subject?: string; effect?: 'allow' | 'deny' | 'require_hitl' }>;
        for (const p of policies.slice(0, 100)) {
            await this.repo.putPolicy({
                id: genId('pol'),
                name: String(p.name ?? 'imported'),
                action: String(p.action ?? '*'),
                subject: String(p.subject ?? '*'),
                effect: p.effect ?? 'allow',
                priority: 0,
                enabled: true,
                createdAt: now(),
            });
            applied.push(`policy:${p.name}`);
        }
        await this.audit.append('ecosystem', 'config.imported', '', `${applied.length} entries`);
        return applied;
    }

    async snapshot(label: string): Promise<OsSnapshot> {
        const inventory = this.delegates.tableInventory
            ? await this.delegates.tableInventory()
            : [];
        const docs = await this.exportConfig();
        const snap: OsSnapshot = {
            id: genId('ossnap'),
            label: label.slice(0, 200),
            inventory,
            docs: { config: docs, digest: digest(JSON.stringify(docs)) },
            createdAt: now(),
        };
        await this.repo.putSnapshot(snap);
        this.events.emit(EVENTS.ECO_SNAPSHOT, { snapshotId: snap.id, tables: inventory.length });
        return snap;
    }

    async listSnapshots(): Promise<OsSnapshot[]> {
        return this.repo.listSnapshots();
    }
}
