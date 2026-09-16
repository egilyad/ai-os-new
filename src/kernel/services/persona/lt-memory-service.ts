/**
 * LtMemoryService — Wave 4.1 (additive over Memory Mesh, untouched).
 *
 * Simple long-term API + core/recall/archival tiers + graph links.
 * Search is deterministic token-overlap (offline); an embedding retriever
 * can replace `score()` later without changing callers.
 */
import type { IEventBus } from '../../types/interfaces';
import type { PersonaRepository } from '../../dal/persona-repository';
import type {
    ILtMemoryService,
    IPersonaLlmPort,
} from '../../contracts/persona';
import type { LongTermMemory, MemoryLink, MemoryRelation, MemoryTier } from '../../types/persona-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('LtMemory');

function now(): number {
    return Date.now();
}

function tokens(s: string): Set<string> {
    return new Set(
        s
            .toLowerCase()
            .split(/[^a-zа-яё0-9]+/u)
            .filter((t) => t.length > 2),
    );
}

function overlapScore(query: string, content: string): number {
    const q = tokens(query);
    if (q.size === 0) return 0;
    const c = tokens(content);
    let hit = 0;
    for (const t of q) if (c.has(t)) hit += 1;
    return hit / q.size;
}

const TIER_ORDER: Record<MemoryTier, number> = { core: 0, recall: 1, archival: 2 };
const TIERS: MemoryTier[] = ['core', 'recall', 'archival'];

export class LtMemoryService implements ILtMemoryService {
    constructor(
        private repo: PersonaRepository,
        private events: IEventBus,
        private llm?: IPersonaLlmPort,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // no background work
    }

    async remember(input: {
        ownerId: string;
        content: string;
        tier?: MemoryTier;
        tags?: string[];
        importance?: number;
    }): Promise<LongTermMemory> {
        const t = now();
        const m: LongTermMemory = {
            id: genId('ltm'),
            ownerId: input.ownerId,
            tier: input.tier ?? 'recall',
            content: input.content,
            tags: input.tags ? [...input.tags] : undefined,
            importance: input.importance,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putMemory(m);
        this.events.emit(EVENTS.MEMORY_REMEMBERED, {
            memoryId: m.id,
            ownerId: m.ownerId,
            tier: m.tier,
        });
        return m;
    }

    async recall(ownerId: string, query: string, limit = 5): Promise<LongTermMemory[]> {
        const all = await this.repo.listMemories(ownerId);
        const ranked = all
            .filter((m) => m.tier !== 'archival')
            .map((m) => ({ m, s: overlapScore(query, m.content) + (m.tier === 'core' ? 0.2 : 0) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, limit);
        const t = now();
        for (const r of ranked) {
            r.m.lastAccessedAt = t;
            await this.repo.putMemory(r.m);
        }
        return ranked.map((r) => r.m);
    }

    async coreContext(ownerId: string): Promise<string> {
        const all = await this.repo.listMemories(ownerId);
        const core = all.filter((m) => m.tier === 'core').slice(0, 20);
        if (core.length === 0) return '';
        return core.map((m) => `- ${m.content}`.slice(0, 500)).join('\n');
    }

    async promote(id: string): Promise<LongTermMemory> {
        const m = await this.require(id);
        const idx = TIER_ORDER[m.tier];
        if (idx > 0) {
            m.tier = TIERS[idx - 1] as MemoryTier;
            m.updatedAt = now();
            await this.repo.putMemory(m);
            this.events.emit(EVENTS.MEMORY_PROMOTED, { memoryId: id, tier: m.tier });
        }
        return m;
    }

    async demote(id: string): Promise<LongTermMemory> {
        const m = await this.require(id);
        const idx = TIER_ORDER[m.tier];
        if (idx < TIERS.length - 1) {
            m.tier = TIERS[idx + 1] as MemoryTier;
            m.updatedAt = now();
            await this.repo.putMemory(m);
            this.events.emit(EVENTS.MEMORY_PROMOTED, { memoryId: id, tier: m.tier });
        }
        return m;
    }

    async forget(id: string): Promise<void> {
        await this.repo.deleteMemory(id);
        this.events.emit(EVENTS.MEMORY_FORGOTTEN, { memoryId: id });
    }

    async link(fromId: string, toId: string, relation: MemoryRelation): Promise<MemoryLink> {
        await this.require(fromId);
        await this.require(toId);
        const link: MemoryLink = { id: genId('mlink'), fromId, toId, relation, createdAt: now() };
        await this.repo.putLink(link);
        this.events.emit(EVENTS.MEMORY_LINKED, { fromId, toId, relation });
        return link;
    }

    async neighbors(id: string, depth = 1): Promise<LongTermMemory[]> {
        await this.require(id);
        const links = await this.repo.listLinks();
        const adj = new Map<string, string[]>();
        for (const l of links) {
            const a = adj.get(l.fromId) ?? [];
            a.push(l.toId);
            adj.set(l.fromId, a);
            const b = adj.get(l.toId) ?? [];
            b.push(l.fromId);
            adj.set(l.toId, b);
        }
        const seen = new Set<string>([id]);
        let frontier = [id];
        for (let d = 0; d < depth; d++) {
            const next: string[] = [];
            for (const cur of frontier) {
                for (const nb of adj.get(cur) ?? []) {
                    if (!seen.has(nb)) {
                        seen.add(nb);
                        next.push(nb);
                    }
                }
            }
            frontier = next;
        }
        seen.delete(id);
        const out: LongTermMemory[] = [];
        for (const mid of seen) {
            const m = await this.repo.getMemory(mid);
            if (m) out.push(m);
        }
        return out;
    }

    async summarize(ownerId: string): Promise<string> {
        const all = await this.repo.listMemories(ownerId);
        if (all.length === 0) return 'No long-term memories.';
        if (this.llm) {
            try {
                return await this.llm.summarizeMemories(all.slice(0, 50));
            } catch (e) {
                LOGGER.warn('llm summarize failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const byTier: Record<string, number> = {};
        for (const m of all) byTier[m.tier] = (byTier[m.tier] ?? 0) + 1;
        const top = all.slice(0, 5).map((m) => `- [${m.tier}] ${m.content.slice(0, 200)}`);
        return (
            `${all.length} memories ` +
            `(core ${byTier['core'] ?? 0} / recall ${byTier['recall'] ?? 0} / archival ${byTier['archival'] ?? 0}).\n` +
            top.join('\n')
        );
    }

    private async require(id: string): Promise<LongTermMemory> {
        const m = await this.repo.getMemory(id);
        if (!m) throw new Error(`Memory not found: ${id}`);
        return m;
    }
}
