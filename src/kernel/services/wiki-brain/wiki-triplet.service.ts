/**
 * Wiki triplet store — persists subject–predicate–object facts extracted by
 * ingest-analyze into the existing wiki-brain knowledge-unit tables.
 *
 * Reuses KnowledgeUnitService (no new Dexie tables). Subject/object become
 * `entity` units (deduplicated by normalized text), predicate is mapped onto
 * the existing KnowledgeRelation taxonomy with a safe fallback.
 */
import type { KnowledgeRelation, TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';
import { KnowledgeUnitService } from './wiki-knowledge-unit.service';

export interface WikiTriplet {
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
}

export interface StoredTriplet {
    subjectUnitId: string;
    objectUnitId: string;
    relation: KnowledgeRelation;
    weight: number;
}

const PREDICATE_MAP: Record<string, KnowledgeRelation> = {
    supports: 'supports',
    supported_by: 'supports',
    contradicts: 'contradicts',
    opposes: 'contradicts',
    depends_on: 'depends_on',
    requires: 'depends_on',
    contains: 'contains',
    includes: 'contains',
    part_of: 'contains',
    implements: 'implements',
    improves: 'improves',
    refines: 'refines',
    derives_from: 'derived_from',
    derived_from: 'derived_from',
    cites: 'cites',
    references: 'cites',
    responds_to: 'responds_to',
};

function normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export class WikiTripletService {
    constructor(private units: KnowledgeUnitService = new KnowledgeUnitService()) {}

    private mapPredicate(predicate: string): KnowledgeRelation {
        return PREDICATE_MAP[normalize(predicate).replace(/[\s-]+/g, '_')] ?? 'connected_to';
    }

    async store(triplets: WikiTriplet[], pageId: string): Promise<StoredTriplet[]> {
        const all = await this.units.listAll();
        const byText = new Map<string, TWikiKnowledgeUnit>();
        for (const u of all) byText.set(normalize(u.text), u);

        const ensureUnit = async (text: string): Promise<TWikiKnowledgeUnit> => {
            const key = normalize(text);
            const existing = byText.get(key);
            if (existing) return existing;
            const created = await this.units.addUnit({
                pageId,
                text: text.trim(),
                kind: 'entity',
            });
            byText.set(key, created);
            return created;
        };

        const out: StoredTriplet[] = [];
        for (const t of triplets) {
            if (!t.subject?.trim() || !t.object?.trim()) continue;
            const subject = await ensureUnit(t.subject);
            const object = await ensureUnit(t.object);
            const relation = this.mapPredicate(t.predicate);
            await this.units.addRelation({
                fromUnitId: subject.id,
                toUnitId: object.id,
                relation,
                weight: Math.max(0, Math.min(1, t.confidence)),
            });
            out.push({
                subjectUnitId: subject.id,
                objectUnitId: object.id,
                relation,
                weight: t.confidence,
            });
        }
        return out;
    }

    /** Multi-hop neighbourhood via the stored typed relations (PPR-lite). */
    async neighbourhood(unitId: string, depth = 2): Promise<string[]> {
        const seen = new Set<string>([unitId]);
        let frontier = [unitId];
        for (let d = 0; d < depth; d++) {
            const next: string[] = [];
            for (const id of frontier) {
                for (const rel of await this.units.listRelations(id)) {
                    const neighbor = rel.fromUnitId === id ? rel.toUnitId : rel.fromUnitId;
                    if (!seen.has(neighbor)) {
                        seen.add(neighbor);
                        next.push(neighbor);
                    }
                }
            }
            frontier = next;
            if (frontier.length === 0) break;
        }
        seen.delete(unitId);
        return [...seen];
    }
}
