/**
 * ScopedMemService — G.3 (Mem0-style scoped memory, additive).
 *
 * Scopes are namespaced owner ids: `user:<id>`, `agent:<id>`, `run:<id>`,
 * `app:<id>`. Every update pushes the previous content into `versions`
 * (capped at 20). Search is token-overlap; the existing memoryLinks graph
 * stays the place for relations between memories.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DatabaseService } from '../../services/database-service';
import type { IScopedMemService } from '../../contracts/rivals2';
import type { ScopedMem } from '../../types/rival2-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ScopedMem');

function now(): number {
    return Date.now();
}

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function score(query: string, content: string): number {
    const q = tokens(query);
    if (q.size === 0) return 0;
    const c = tokens(content);
    let hit = 0;
    for (const t of q) if (c.has(t)) hit += 1;
    return hit / q.size;
}

export class ScopedMemService implements IScopedMemService {
    constructor(
        private db: DatabaseService,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async add(scope: string, ownerId: string, content: string): Promise<ScopedMem> {
        const t = now();
        const mem: ScopedMem = {
            id: genId('smem'),
            scope: scope.slice(0, 40),
            ownerId: ownerId.slice(0, 160),
            content: content.slice(0, 4000),
            versions: [],
            createdAt: t,
            updatedAt: t,
        };
        await this.db.scopedMem.put({ ...mem });
        this.events.emit(EVENTS.SMEM_ADDED, { memoryId: mem.id, scope: mem.scope });
        return mem;
    }

    async search(scope: string, ownerId: string, query: string, limit = 5): Promise<ScopedMem[]> {
        const rows = await this.db.scopedMem.toArray();
        return rows
            .filter((r) => r.scope === scope && r.ownerId === ownerId)
            .map((r) => ({ m: { ...r }, s: score(query, r.content) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, Math.max(1, limit))
            .map((r) => r.m);
    }

    async get(id: string): Promise<ScopedMem | null> {
        const r = await this.db.scopedMem.get(id);
        return r ? { ...r } : null;
    }

    async update(id: string, content: string): Promise<ScopedMem> {
        const r = await this.db.scopedMem.get(id);
        if (!r) throw new Error(`Scoped memory not found: ${id}`);
        r.versions.push({ content: r.content, at: r.updatedAt });
        if (r.versions.length > 20) r.versions.splice(0, r.versions.length - 20);
        r.content = content.slice(0, 4000);
        r.updatedAt = now();
        await this.db.scopedMem.put(r);
        return { ...r };
    }

    async delete(id: string): Promise<void> {
        await this.db.scopedMem.delete(id);
    }

    async history(id: string): Promise<Array<{ content: string; at: number }>> {
        const r = await this.db.scopedMem.get(id);
        if (!r) throw new Error(`Scoped memory not found: ${id}`);
        return [...r.versions];
    }
}
