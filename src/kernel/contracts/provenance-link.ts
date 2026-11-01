/**
 * Когнитивная цепочка provenance (ROADMAP_03 §P4, map-02).
 *
 * Цель — двунаправленно связывать «дебаты → память → кристаллы → синтез»
 * и прослеживать, что на что повлияло (debate→memory provenance и т.д.).
 */

export interface ProvenanceRef {
    kind: 'debate' | 'memory' | 'crystal' | 'synthesis' | 'knowledge' | 'agent' | string;
    id: string;
}

export type ProvenanceRelation = 'influenced' | 'derived_from' | 'evidenced_by' | 'contradicts' | 'synthesized_into';

export interface ProvenanceLink {
    id: string;
    from: ProvenanceRef;
    to: ProvenanceRef;
    relation: ProvenanceRelation;
    ts: number;
    /** Опциональный вес/уверенность. */
    weight?: number;
}

export interface IProvenanceLinker {
    link(from: ProvenanceRef, to: ProvenanceRef, relation: ProvenanceRelation, weight?: number): ProvenanceLink;
    get(filter?: { kind?: string; id?: string }): ProvenanceLink[];
    clear(): void;
}
