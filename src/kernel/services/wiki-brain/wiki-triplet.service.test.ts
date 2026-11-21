import { describe, it, expect, beforeEach } from 'vitest';
import { WikiTripletService } from './wiki-triplet.service';
import { KnowledgeUnitService } from './wiki-knowledge-unit.service';
import { createWikiBrainDB, getWikiBrainDB } from './wiki-brain-dexie';
import { anchorDexieInstance } from '../dexie-identity';
import Dexie from 'dexie';

await anchorDexieInstance('wiki-triplet.test', new Dexie('wiki-triplet-test'));

describe('WikiTripletService', () => {
    beforeEach(async () => {
        createWikiBrainDB('aios-wiki-triplet-test');
        const db = getWikiBrainDB();
        await db.delete();
        await db.open();
    });

    it('stores triplets as units + typed relations and deduplicates entities', async () => {
        const svc = new WikiTripletService(new KnowledgeUnitService());
        const stored = await svc.store(
            [
                { subject: 'OpenCode', predicate: 'supports', object: 'MCP', confidence: 0.9 },
                { subject: 'OpenCode', predicate: 'depends_on', object: 'Node', confidence: 0.7 },
            ],
            'page-1',
        );
        expect(stored).toHaveLength(2);
        expect(stored[0]!.relation).toBe('supports');
        expect(stored[1]!.relation).toBe('depends_on');
        expect((await getWikiBrainDB().knowledgeUnits.toArray()).length).toBe(3); // OpenCode deduped
    });

    it('maps unknown predicates safely to connected_to', async () => {
        const svc = new WikiTripletService(new KnowledgeUnitService());
        const stored = await svc.store(
            [{ subject: 'A', predicate: 'weird relation', object: 'B', confidence: 0.5 }],
            'p',
        );
        expect(stored[0]!.relation).toBe('connected_to');
    });

    it('traverses multi-hop neighbourhood', async () => {
        const svc = new WikiTripletService(new KnowledgeUnitService());
        const stored = await svc.store(
            [
                { subject: 'A', predicate: 'supports', object: 'B', confidence: 0.9 },
                { subject: 'B', predicate: 'depends_on', object: 'C', confidence: 0.8 },
            ],
            'p',
        );
        const neighbours = await svc.neighbourhood(stored[0]!.subjectUnitId, 2);
        expect(neighbours).toContain(stored[0]!.objectUnitId);
        expect(neighbours).toContain(stored[1]!.objectUnitId);
    });
});
