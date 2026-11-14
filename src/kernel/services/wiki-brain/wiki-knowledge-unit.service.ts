import type {
    KnowledgeRelation,
    TWikiKnowledgeRelation,
    TWikiKnowledgeUnit,
} from '../../contracts/wiki-brain/types';
import { getWikiBrainDB } from './wiki-brain-dexie';
import { wikiId } from './wiki-brain-dexie';

export interface CreateKnowledgeUnitInput {
    pageId: string;
    paragraphId?: string;
    text: string;
    kind?: TWikiKnowledgeUnit['kind'];
    evidence?: string[];
    links?: string[];
    span?: { begin: number; end: number };
    projectId?: string;
}

export interface CreateKnowledgeRelationInput {
    fromUnitId: string;
    toUnitId: string;
    relation: KnowledgeRelation;
    weight?: number;
    validFrom?: string;
    validTo?: string;
}

/**
 * KnowledgeUnitService — F0: claim-level knowledge units and typed relations.
 * Units are first-class records (stable id, evidence, source span) independent
 * of whole pages; relations use the unified KnowledgeRelation taxonomy.
 */
export class KnowledgeUnitService {
    async addUnit(input: CreateKnowledgeUnitInput): Promise<TWikiKnowledgeUnit> {
        const now = new Date().toISOString();
        const unit: TWikiKnowledgeUnit = {
            id: wikiId('ku'),
            pageId: input.pageId,
            paragraphId: input.paragraphId,
            text: input.text,
            kind: input.kind ?? 'note',
            evidence: input.evidence ?? [],
            links: input.links ?? [],
            span: input.span,
            projectId: input.projectId,
            createdAt: now,
            updatedAt: now,
        };
        await getWikiBrainDB().knowledgeUnits.add(unit as never);
        return unit;
    }

    async getUnit(id: string): Promise<TWikiKnowledgeUnit | undefined> {
        return (await getWikiBrainDB().knowledgeUnits.get(id)) as unknown as
            TWikiKnowledgeUnit | undefined;
    }

    async listUnitsByPage(pageId: string): Promise<TWikiKnowledgeUnit[]> {
        const rows = (await getWikiBrainDB()
            .knowledgeUnits.where('pageId')
            .equals(pageId)
            .toArray()) as unknown as TWikiKnowledgeUnit[];
        return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    async listUnitsByProject(projectId: string): Promise<TWikiKnowledgeUnit[]> {
        const rows = (await getWikiBrainDB()
            .knowledgeUnits.where('projectId')
            .equals(projectId)
            .toArray()) as unknown as TWikiKnowledgeUnit[];
        return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    async updateUnit(
        id: string,
        patch: Partial<Omit<TWikiKnowledgeUnit, 'id' | 'createdAt'>>,
    ): Promise<TWikiKnowledgeUnit | undefined> {
        await getWikiBrainDB().knowledgeUnits.update(id, {
            ...patch,
            updatedAt: new Date().toISOString(),
        } as never);
        return this.getUnit(id);
    }

    async removeUnit(id: string): Promise<void> {
        const db = getWikiBrainDB();
        await db.knowledgeUnits.delete(id);
        await db.knowledgeRelations.where('fromUnitId').equals(id).delete();
        await db.knowledgeRelations.where('toUnitId').equals(id).delete();
    }

    async addRelation(input: CreateKnowledgeRelationInput): Promise<TWikiKnowledgeRelation> {
        const relation: TWikiKnowledgeRelation = {
            id: wikiId('kr'),
            fromUnitId: input.fromUnitId,
            toUnitId: input.toUnitId,
            relation: input.relation,
            weight: input.weight ?? 1,
            validFrom: input.validFrom,
            validTo: input.validTo,
            createdAt: new Date().toISOString(),
        };
        await getWikiBrainDB().knowledgeRelations.add(relation as never);
        return relation;
    }

    async listRelations(unitId: string): Promise<TWikiKnowledgeRelation[]> {
        const db = getWikiBrainDB();
        const out = (await db.knowledgeRelations
            .where('fromUnitId')
            .equals(unitId)
            .toArray()) as unknown as TWikiKnowledgeRelation[];
        const inbound = (await db.knowledgeRelations
            .where('toUnitId')
            .equals(unitId)
            .toArray()) as unknown as TWikiKnowledgeRelation[];
        return [...out, ...inbound];
    }

    async findRelationsByType(relation: KnowledgeRelation): Promise<TWikiKnowledgeRelation[]> {
        const rows = (await getWikiBrainDB()
            .knowledgeRelations.where('relation')
            .equals(relation)
            .toArray()) as unknown as TWikiKnowledgeRelation[];
        return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    async removeRelation(id: string): Promise<void> {
        await getWikiBrainDB().knowledgeRelations.delete(id);
    }
}

export const knowledgeUnitService = new KnowledgeUnitService();
