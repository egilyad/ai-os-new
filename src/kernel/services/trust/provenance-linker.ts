import type {
    IProvenanceLinker,
    ProvenanceLink,
    ProvenanceRef,
    ProvenanceRelation,
} from '../../contracts/provenance-link';

/**
 * ProvenanceLinker — in-memory реестр связей происхождения (cognitive provenance).
 *
 * Позволяет связывать сущности (дебаты/память/кристаллы/синтез) и затем
 * прослеживать «что на что повлияло». Позже может быть персистентен в Dexie.
 */
export class ProvenanceLinker implements IProvenanceLinker {
    private links: ProvenanceLink[] = [];
    private static readonly MAX_LINKS = 5000;

    link(
        from: ProvenanceRef,
        to: ProvenanceRef,
        relation: ProvenanceRelation,
        weight?: number,
    ): ProvenanceLink {
        const link: ProvenanceLink = {
            id: `pp-${crypto.randomUUID()}`,
            from: { ...from },
            to: { ...to },
            relation,
            ts: Date.now(),
            weight,
        };
        this.links.push(link);
        if (this.links.length > ProvenanceLinker.MAX_LINKS) {
            this.links = this.links.slice(-ProvenanceLinker.MAX_LINKS);
        }
        return link;
    }

    get(filter?: { kind?: string; id?: string }): ProvenanceLink[] {
        if (!filter) return [...this.links];
        return this.links.filter(
            (l) =>
                (!filter.kind || l.from.kind === filter.kind || l.to.kind === filter.kind) &&
                (!filter.id || l.from.id === filter.id || l.to.id === filter.id),
        );
    }

    /** Соседи сущности по связям (для обхода графа provenance). */
    getNeighbors(id: string): Array<{ ref: ProvenanceRef; relation: ProvenanceRelation }> {
        const out: Array<{ ref: ProvenanceRef; relation: ProvenanceRelation }> = [];
        for (const l of this.links) {
            if (l.from.id === id) out.push({ ref: l.to, relation: l.relation });
            if (l.to.id === id) out.push({ ref: l.from, relation: l.relation });
        }
        return out;
    }

    /**
     * BFS-обход от стартовой сущности; возвращает достижимые ref.
     * Полезно для прослеживания «что на что повлияло».
     */
    getTrail(start: ProvenanceRef, maxDepth = 5): ProvenanceRef[] {
        const seen = new Set<string>();
        const queue: Array<{ ref: ProvenanceRef; depth: number }> = [{ ref: start, depth: 0 }];
        const out: ProvenanceRef[] = [];

        while (queue.length > 0) {
            const { ref, depth } = queue.shift()!;
            const key = `${ref.kind}:${ref.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(ref);
            if (depth >= maxDepth) continue;
            for (const n of this.getNeighbors(ref.id)) {
                const nk = `${n.ref.kind}:${n.ref.id}`;
                if (!seen.has(nk)) queue.push({ ref: n.ref, depth: depth + 1 });
            }
        }
        return out;
    }

    clear(): void {
        this.links = [];
    }

    /** Экспорт связей (для persist). */
    exportJson(): string {
        return JSON.stringify({ links: this.links });
    }

    /** Импорт связей (пере-загрузка). Возвращает число импортированных. */
    importJson(json: string): number {
        try {
            const data = JSON.parse(json) as { links?: ProvenanceLink[] };
            const links = Array.isArray(data.links) ? data.links : [];
            let imported = 0;
            for (const l of links) {
                if (l?.id && l?.from && l?.to && l?.relation) {
                    this.links.push(l);
                    imported++;
                }
            }
            if (this.links.length > ProvenanceLinker.MAX_LINKS) {
                this.links = this.links.slice(-ProvenanceLinker.MAX_LINKS);
            }
            return imported;
        } catch {
            return 0;
        }
    }
}
