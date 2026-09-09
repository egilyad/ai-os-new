/**
 * CogMemoryService — Wave 9 (unified episodic/semantic/procedural/identity).
 *
 * One API over four memory kinds + private/team/shared scopes with
 * governance policies (forget/compress/expire/importance/privacy),
 * counterfactual "what-if" records and knowledge-package compilation.
 * LtMemory/Mesh/Crystals untouched — this service owns the unified view and
 * can link outward via delegates later.
 */
import type { IEventBus } from '../../types/interfaces';
import type { MetaRepository } from '../../dal/meta-repository';
import type { ICogMemoryService } from '../../contracts/meta';
import type {
    CogMemory,
    CogMemoryKind,
    CounterfactualRecord,
    KnowledgePackage,
    MemoryPolicy,
    MemoryScope,
} from '../../types/meta-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CogMemory');

function now(): number {
    return Date.now();
}

function tokens(s: string): Set<string> {
    return new Set(
        s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2),
    );
}

function score(query: string, content: string): number {
    const q = tokens(query);
    if (q.size === 0) return 0;
    const c = tokens(content);
    let hit = 0;
    for (const t of q) if (c.has(t)) hit += 1;
    return hit / q.size;
}

export class CogMemoryService implements ICogMemoryService {
    constructor(
        private repo: MetaRepository,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async write(input: {
        kind: CogMemoryKind;
        scope?: MemoryScope;
        ownerId: string;
        teamId?: string;
        content: string;
        importance?: number;
    }): Promise<CogMemory> {
        const t = now();
        const m: CogMemory = {
            id: genId('cog'),
            kind: input.kind,
            scope: input.scope ?? 'private',
            ownerId: input.ownerId,
            teamId: input.teamId,
            content: input.content.slice(0, 4000),
            importance: input.importance ?? 0.5,
            accessCount: 0,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putCogMemory(m);
        this.events.emit(EVENTS.COG_WRITTEN, { memoryId: m.id, kind: m.kind, scope: m.scope });
        return m;
    }

    async read(ownerId: string, query: string, kind?: CogMemoryKind, limit = 5): Promise<CogMemory[]> {
        const all = await this.repo.listCogMemories();
        const ranked = all
            .filter(
                (m) =>
                    (m.ownerId === ownerId || m.scope === 'shared') &&
                    (!kind || m.kind === kind),
            )
            .map((m) => ({ m, s: score(query, m.content) + m.importance * 0.2 }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, Math.max(1, limit));
        const t = now();
        for (const r of ranked) {
            r.m.accessCount += 1;
            r.m.lastAccessedAt = t;
            await this.repo.putCogMemory(r.m);
        }
        return ranked.map((r) => r.m);
    }

    async setPolicy(input: {
        scope: MemoryScope;
        maxAgeMs?: number;
        maxEntries?: number;
        minImportance?: number;
        compressAfterMs?: number;
    }): Promise<MemoryPolicy> {
        const existing = (await this.repo.listPolicies()).find((p) => p.scope === input.scope);
        const policy: MemoryPolicy = {
            id: existing?.id ?? genId('mpol'),
            scope: input.scope,
            maxAgeMs: input.maxAgeMs ?? existing?.maxAgeMs,
            maxEntries: input.maxEntries ?? existing?.maxEntries,
            minImportance: input.minImportance ?? existing?.minImportance,
            compressAfterMs: input.compressAfterMs ?? existing?.compressAfterMs,
            createdAt: existing?.createdAt ?? now(),
        };
        await this.repo.putPolicy(policy);
        return policy;
    }

    async govern(scope?: MemoryScope): Promise<number> {
        const policies = await this.repo.listPolicies();
        const all = await this.repo.listCogMemories();
        const t = now();
        let removed = 0;
        const byScope = new Map<MemoryScope, CogMemory[]>();
        for (const m of all) {
            if (scope && m.scope !== scope) continue;
            const list = byScope.get(m.scope) ?? [];
            list.push(m);
            byScope.set(m.scope, list);
        }
        for (const [memScope, list] of byScope) {
            const policy = policies.find((p) => p.scope === memScope);
            if (!policy) continue;
            // Expiry + importance floor.
            for (const m of list) {
                const expired = policy.maxAgeMs !== undefined && t - m.createdAt > policy.maxAgeMs;
                const trivial = policy.minImportance !== undefined && m.importance < policy.minImportance;
                if (expired || trivial) {
                    await this.repo.deleteCogMemory(m.id);
                    removed += 1;
                }
            }
            // Over-quota: keep highest (importance + recency).
            if (policy.maxEntries !== undefined) {
                const rest = (await this.repo.listCogMemories()).filter((m) => m.scope === memScope);
                if (rest.length > policy.maxEntries) {
                    rest.sort(
                        (a, b) =>
                            b.importance - a.importance ||
                            (b.lastAccessedAt ?? b.createdAt) - (a.lastAccessedAt ?? a.createdAt),
                    );
                    for (const extra of rest.slice(policy.maxEntries)) {
                        await this.repo.deleteCogMemory(extra.id);
                        removed += 1;
                    }
                }
            }
        }
        if (removed > 0) this.events.emit(EVENTS.COG_GOVERNED, { removed, scope: scope ?? 'all' });
        return removed;
    }

    async recordCounterfactual(input: {
        ownerId: string;
        whatHappened: string;
        whatIf: string;
        lesson: string;
    }): Promise<CounterfactualRecord> {
        const rec: CounterfactualRecord = {
            id: genId('cf'),
            ownerId: input.ownerId,
            whatHappened: input.whatHappened.slice(0, 2000),
            whatIf: input.whatIf.slice(0, 2000),
            lesson: input.lesson.slice(0, 2000),
            createdAt: now(),
        };
        await this.repo.putCounterfactual(rec);
        this.events.emit(EVENTS.COG_COUNTERFACTUAL, { recordId: rec.id, ownerId: rec.ownerId });
        return rec;
    }

    async listCounterfactuals(ownerId: string): Promise<CounterfactualRecord[]> {
        const all = await this.repo.listCounterfactuals();
        return all.filter((c) => c.ownerId === ownerId);
    }

    async compilePackage(input: { name: string; taskClass: string }): Promise<KnowledgePackage> {
        const t = now();
        const strategies = (await this.repo.listStrategies()).filter((s) => s.taskClass === input.taskClass);
        strategies.sort((a, b) => b.successRate - a.successRate);
        const best = strategies[0];
        const memories = (await this.repo.listCogMemories())
            .filter((m) => m.kind === 'procedural' || m.kind === 'semantic')
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 10);
        const existing = (await this.repo.listPackages()).find(
            (p) => p.name === input.name && p.taskClass === input.taskClass,
        );
        const pkg: KnowledgePackage = {
            id: existing?.id ?? genId('kpkg'),
            name: input.name,
            taskClass: input.taskClass,
            playbook: best ? [...best.steps] : [],
            strategyIds: strategies.slice(0, 5).map((s) => s.id),
            memoryIds: memories.map((m) => m.id),
            version: (existing?.version ?? 0) + 1,
            createdAt: existing?.createdAt ?? t,
            updatedAt: t,
        };
        await this.repo.putPackage(pkg);
        this.events.emit(EVENTS.COG_COMPILED, { packageId: pkg.id, taskClass: pkg.taskClass });
        return pkg;
    }

    async listPackages(): Promise<KnowledgePackage[]> {
        return this.repo.listPackages();
    }
}
