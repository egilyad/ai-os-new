/**
 * MemoryRepository — DAL wrapper for memory entries
 *
 * Provides typed access to conversation context and learned patterns.
 * Uses Dexie as the backing store with read-through caching.
 */

import type { DatabaseService } from '../services/database-service';
import type { MemoryEntry } from '../types/memory-types';
import { rootLogger } from '../services/logger-service';
import { computeMemoryId } from '../utils/compute-memory-id';

const LOGGER = rootLogger.child('MemoryRepository');

const MAX_ENTRIES = 1000;

export class MemoryRepository {
    private cache: Map<string, MemoryEntry> = new Map();
    private cacheLoaded = false;
    private cachePromise: Promise<void> | null = null;
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    /** Load all memories from Dexie into cache (read-through) */
    private async ensureCache(): Promise<void> {
        if (this.cacheLoaded) return;
        if (!this.cachePromise) {
            this.cachePromise = this._loadCache().catch((err) => {
                this.cachePromise = null;
                throw err;
            });
        }
        await this.cachePromise;
    }

    private async _loadCache(): Promise<void> {
        const entries = await this.db.memories
            .orderBy('[metadata.timestamp]')
            .reverse()
            .limit(MAX_ENTRIES)
            .toArray();

        this.cache.clear();
        for (const entry of entries) {
            this.cache.set(entry.id, entry);
        }
        this.cacheLoaded = true;
    }

    /** Get all memories, sorted by timestamp descending */
    async getAll(): Promise<MemoryEntry[]> {
        await this.ensureCache();
        return Array.from(this.cache.values());
    }

    /** Get a single memory by ID */
    async get(id: string): Promise<MemoryEntry | undefined> {
        await this.ensureCache();

        // Check cache first
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        // Fallback to Dexie
        const entry = await this.db.memories.get(id);
        if (entry) {
            this.cache.set(entry.id, entry);
        }
        return entry;
    }

    /** Store a new memory entry with deterministic ID */
    async store(entry: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry> {
        const id = await this.computeId(entry.content, entry.metadata.source, entry.metadata.type);
        const newEntry: MemoryEntry = {
            ...entry,
            id,
        } as MemoryEntry;

        // Dexie first (source of truth)
        await this.db.memories.put(newEntry);

        // Update cache after successful persist
        this.cache.set(newEntry.id, newEntry);
        await this.enforceLimit();

        return newEntry;
    }

    /** Update or insert a memory entry with deterministic ID */
    async upsert(entry: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry> {
        const id = await this.computeId(entry.content, entry.metadata.source, entry.metadata.type);
        const existed = this.cache.has(id);
        // H4: Wrap in Dexie transaction to prevent TOCTOU race
        const dexie = this.db.db;
        await dexie.transaction('rw', dexie.memories, async () => {
            const existing = await this.db.memories.get(id);
            const m: MemoryEntry = existing
                ? { ...existing, ...entry, id, vector: entry.vector ?? existing.vector }
                : ({ ...entry, id } as MemoryEntry);
            await this.db.memories.put(m);
        });
        const merged = await this.db.memories.get(id);
        if (!merged) {
            LOGGER.error('MemoryRepository', 'upsert: record vanished after write', { id });
            return entry as MemoryEntry;
        }
        this.cache.set(merged.id, merged);
        if (!existed) await this.enforceLimit();

        return merged;
    }

    /** Delete a memory entry */
    async delete(id: string): Promise<void> {
        await this.db.memories.delete(id);
        this.cache.delete(id);
    }

    /** Get total count of stored memories */
    async getCount(): Promise<number> {
        return this.db.memories.count();
    }

    /** Partially update a memory entry */
    async update(id: string, changes: Partial<MemoryEntry>): Promise<void> {
        const modified = await this.db.memories.update(id, changes as Partial<MemoryEntry>);
        if (modified === 0) {
            LOGGER.warn('MemoryRepository', 'update: id not found', { id });
        }
        if (this.cache.has(id)) {
            const existing = this.cache.get(id)!;
            this.cache.set(id, { ...existing, ...changes });
        }
    }

    /** Save an entry with its existing ID (unlike store() which generates a new ID) */
    async save(entry: MemoryEntry): Promise<void> {
        await this.db.memories.put(entry);
        this.cache.set(entry.id, entry);
        await this.enforceLimit();
    }

    /** Store multiple entries in batch (atomic via Dexie transaction) */
    async storeBatch(entries: Omit<MemoryEntry, 'id'>[]): Promise<MemoryEntry[]> {
        const dexie = this.db.db;
        const newEntries = (await Promise.all(
            entries.map(async (e) => ({
                ...e,
                id: await this.computeId(e.content, e.metadata.source, e.metadata.type),
            })),
        )) as MemoryEntry[];
        await dexie.transaction('rw', dexie.memories, async () => {
            await dexie.memories.bulkPut(newEntries);
        });
        for (const entry of newEntries) {
            this.cache.set(entry.id, entry);
        }
        await this.enforceLimit();
        return newEntries;
    }

    /** Search memories by keyword (simple substring match) */
    async search(query: string, options?: { limit?: number }): Promise<MemoryEntry[]> {
        await this.ensureCache();

        const lowerQuery = query.toLowerCase();
        const limit = options?.limit ?? 50;

        const results: MemoryEntry[] = [];
        for (const entry of this.cache.values()) {
            if (entry.content.toLowerCase().includes(lowerQuery)) {
                results.push(entry);
                if (results.length >= limit) break;
            }
        }

        return results;
    }

    /** Prune entries older than timestamp, return count deleted */
    async prune(beforeTimestamp: number): Promise<number> {
        // DAL-3: Query DB directly instead of only cache-resident entries
        const oldEntries = await this.db.memories
            .where('[metadata.timestamp]')
            .below([beforeTimestamp])
            .primaryKeys();

        if (oldEntries.length > 0) {
            // H5: Only delete from cache if DB delete succeeds
            try {
                await this.db.memories.bulkDelete(oldEntries);
                for (const id of oldEntries) {
                    this.cache.delete(id);
                }
            } catch (e) {
                LOGGER.warn('MemoryRepository', 'Evict failed', { error: e });
            }
        }

        return oldEntries.length;
    }

    /** Clear all memory entries */
    async clear(): Promise<void> {
        await this.db.memories.clear();
        this.cache.clear();
    }

    // ---------------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------------

    private async enforceLimit(): Promise<void> {
        if (this.cache.size <= MAX_ENTRIES) return;

        // B10-166: Only evict from cache, never from database
        const sorted = Array.from(this.cache.values())
            .sort((a, b) => (b.metadata.timestamp ?? 0) - (a.metadata.timestamp ?? 0))
            .slice(0, MAX_ENTRIES);

        this.cache.clear();
        for (const entry of sorted) {
            this.cache.set(entry.id, entry);
        }
    }

    private async computeId(content: string, source: string, type: string): Promise<string> {
        return computeMemoryId(content, source, type);
    }
}
