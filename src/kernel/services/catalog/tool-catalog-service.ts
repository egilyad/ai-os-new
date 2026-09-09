/**
 * ToolCatalogService — G2 (STATIC GAP CLOSURE).
 *
 * Unified catalog: ToolRunner tools (executor) + SkillMarket manifests (platform)
 * + optional MCP servers (PROVIDER-PENDING if none connected). Additive —
 * ToolRunnerService unchanged, this is discovery/search.
 * Events: catalog:updated (count) — best-effort.
 */

import type { IToolCatalogService, ToolCatalogEntry, CatalogGroup } from '../../contracts/tool-catalog';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ISkillMarketService } from '../../contracts/ops';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ToolCatalog');

/** Map runner tool name → catalog group (deterministic). */
function groupFor(name: string): CatalogGroup {
    if (name.startsWith('workspace.')) return 'workspace';
    if (name.startsWith('knowledge.')) return 'knowledge';
    if (name.startsWith('mcp.')) return 'mcp';
    if (name === 'http.fetch' || name === 'time.now' || name === 'math.calc') return 'core';
    return 'external';
}

function displayName(name: string): string {
    return name
        .split(/[._]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

export class ToolCatalogService implements IToolCatalogService {
    constructor(private deps: {
        toolRunner: IToolRunnerService;
        skillMarket?: ISkillMarketService;
        mcp?: { listServers?: () => Promise<Array<{ id: string; tools: string[] }>> };
        events: IEventBus;
    }) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {}

    async list(): Promise<ToolCatalogEntry[]> {
        const runner = this.deps.toolRunner.listTools().map((t) => ({
            name: t.name,
            displayName: displayName(t.name),
            description: t.description,
            group: groupFor(t.name) as CatalogGroup,
            source: 'toolRunner' as const,
            installed: true,
        }));

        let platform: ToolCatalogEntry[] = [];
        if (this.deps.skillMarket) {
            try {
                const manifests = await this.deps.skillMarket.list();
                platform = manifests.map((m) => ({
                    name: `skill:${m.name}`,
                    displayName: m.name,
                    description: m.description,
                    group: 'platform' as CatalogGroup,
                    source: 'skillMarket' as const,
                    installed: m.installed,
                    manifestId: m.id,
                }));
            } catch (e) {
                LOGGER.warn('skillMarket list failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }

        let mcp: ToolCatalogEntry[] = [];
        if (this.deps.mcp?.listServers) {
            try {
                const servers = await this.deps.mcp.listServers();
                for (const s of servers) {
                    for (const tool of s.tools ?? []) {
                        mcp.push({
                            name: `mcp:${s.id}:${tool}`,
                            displayName: `${s.id} / ${tool}`,
                            description: `MCP tool ${tool} on ${s.id} (PROVIDER-PENDING if server offline)`,
                            group: 'mcp',
                            source: 'mcp',
                            installed: true,
                        });
                    }
                }
            } catch (e) {
                LOGGER.warn('mcp list failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }

        const all = [...runner, ...platform, ...mcp];
        // dedupe by name (first wins)
        const seen = new Map<string, ToolCatalogEntry>();
        for (const e of all) if (!seen.has(e.name)) seen.set(e.name, e);
        return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    async search(query: string): Promise<ToolCatalogEntry[]> {
        const q = query.toLowerCase().trim();
        if (!q) return this.list();
        const all = await this.list();
        return all.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }

    async get(name: string): Promise<ToolCatalogEntry | null> {
        const all = await this.list();
        return all.find((e) => e.name === name) ?? null;
    }

    async install(name: string): Promise<ToolCatalogEntry> {
        if (!name.startsWith('skill:')) {
            const entry = await this.get(name);
            if (!entry) throw new Error(`Catalog entry not found: ${name}`);
            // core/mcp are always installed — noop but emit for trace
            this.emitUpdated();
            return entry;
        }
        if (!this.deps.skillMarket) throw new Error('SkillMarket not configured');
        const entry = await this.get(name);
        if (!entry?.manifestId) throw new Error(`Skill manifest not found for ${name}`);
        await this.deps.skillMarket.install(entry.manifestId);
        this.emitUpdated();
        const refreshed = await this.get(name);
        if (!refreshed) throw new Error(`Skill disappeared after install: ${name}`);
        return refreshed;
    }

    async uninstall(name: string): Promise<ToolCatalogEntry> {
        if (!name.startsWith('skill:')) {
            const entry = await this.get(name);
            if (!entry) throw new Error(`Catalog entry not found: ${name}`);
            this.emitUpdated();
            return entry;
        }
        if (!this.deps.skillMarket) throw new Error('SkillMarket not configured');
        const entry = await this.get(name);
        if (!entry?.manifestId) throw new Error(`Skill manifest not found for ${name}`);
        await this.deps.skillMarket.uninstall(entry.manifestId);
        this.emitUpdated();
        const refreshed = await this.get(name);
        if (!refreshed) throw new Error(`Skill disappeared after uninstall: ${name}`);
        return refreshed;
    }

    async groups(): Promise<Record<CatalogGroup, number>> {
        const all = await this.list();
        const out: Record<CatalogGroup, number> = {
            core: 0,
            workspace: 0,
            knowledge: 0,
            mcp: 0,
            platform: 0,
            external: 0,
        };
        for (const e of all) out[e.group] = (out[e.group] ?? 0) + 1;
        return out;
    }

    private emitUpdated(): void {
        try {
            // best-effort — event may not be registered yet in static builds
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).CATALOG_UPDATED ?? ('catalog:updated' as unknown as string),
                { at: Date.now() },
            );
        } catch {
            // ignore
        }
    }
}
