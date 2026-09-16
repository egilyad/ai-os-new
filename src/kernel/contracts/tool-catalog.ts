/**
 * Tool Catalog contracts — GAP G2 (STATIC GAP CLOSURE).
 *
 * Additive catalog over ToolRunner (executor) + SkillMarket (platform skills).
 * ToolRunner stays the execution layer; catalog is discovery/search/install.
 * MCP tools appear as group=mcp when mcpService is present (PROVIDER-PENDING if no servers).
 */

import type { ILifecycle } from './lifecycle';

export type CatalogGroup = 'core' | 'workspace' | 'knowledge' | 'mcp' | 'platform' | 'external';

export interface ToolCatalogEntry {
    name: string;
    displayName: string;
    description: string;
    group: CatalogGroup;
    source: 'toolRunner' | 'skillMarket' | 'mcp' | 'external';
    installed: boolean;
    parameters?: Record<string, unknown>;
    /** For platform skills: manifest id */
    manifestId?: string;
}

export interface IToolCatalogService extends ILifecycle {
    /** Full catalog (ToolRunner ∪ SkillMarket ∪ MCP) — additive, no exec. */
    list(): Promise<ToolCatalogEntry[]>;
    /** Search by name/description substring (case-insensitive). */
    search(query: string): Promise<ToolCatalogEntry[]>;
    /** Get one entry by name. */
    get(name: string): Promise<ToolCatalogEntry | null>;
    /** Install platform skill (delegates to SkillMarket.install). Noop for core tools. */
    install(name: string): Promise<ToolCatalogEntry>;
    /** Uninstall platform skill. Noop for core. */
    uninstall(name: string): Promise<ToolCatalogEntry>;
    /** Groups summary for UI. */
    groups(): Promise<Record<CatalogGroup, number>>;
}
