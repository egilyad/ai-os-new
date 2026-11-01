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

    clear(): void {
        this.links = [];
    }
}
