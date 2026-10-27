/**
 * Memory Center domain types.
 *
 * Memory Center is a read-only overview/navigation layer over the existing
 * storage mechanisms. It NEVER owns data — it only describes sources, counts
 * records through their real APIs, and links to originals.
 */

export type MemorySourceStatus = 'verified' | 'partial' | 'unknown' | 'unavailable';

export type MemoryCategory =
    | 'chat'
    | 'debate'
    | 'agent'
    | 'knowledge'
    | 'research'
    | 'config'
    | 'execution'
    | 'fleet'
    | 'user';

export interface MemorySourceCapabilities {
    read: boolean;
    search: boolean;
    count: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
}

export interface MemorySourceDescriptor {
    id: string;
    name: string;
    category: MemoryCategory;
    description: string;
    owner: string;
    storageType: 'dexie' | 'localStorage' | 'memory';
    /** Dexie table name, when the source maps to a table. */
    table?: string;
    capabilities: MemorySourceCapabilities;
    status: MemorySourceStatus;
    /** Route/panel that opens the original (when available). */
    openRoute?: string;
    metadata?: Record<string, unknown>;
}

export interface MemorySourceCount {
    sourceId: string;
    count: number | null;
    reason?: string;
}
