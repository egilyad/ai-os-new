import { describe, expect, it, vi } from 'vitest';
import { WikiContradictionDetector } from './wiki-contradiction-detector';
import { WikiDecayService } from './wiki-decay-service';
import { WikiBrainMcpServer } from './wiki-brain-mcp-server';
import type { TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';

const unit = (over: Partial<TWikiKnowledgeUnit>): TWikiKnowledgeUnit => ({
    id: 'ku-1',
    pageId: 'p1',
    text: '',
    kind: 'note',
    evidence: [],
    links: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
});

describe('F7: WikiContradictionDetector', () => {
    it('флагает пару с общими терминами и контрарным маркером', () => {
        const detector = new WikiContradictionDetector();
        const findings = detector.detect([
            unit({ id: 'a', text: 'LLM agents can plan long horizons' }),
            unit({ id: 'b', text: 'LLM agents cannot plan long horizons' }),
        ]);
        expect(findings).toHaveLength(1);
        expect(findings[0]?.terms).toContain('horizons');
    });

    it('не флагает пару без контрарности', () => {
        const detector = new WikiContradictionDetector();
        const findings = detector.detect([
            unit({ id: 'a', text: 'LLM agents can plan long horizons' }),
            unit({ id: 'b', text: 'LLM agents prefer shorter tasks' }),
        ]);
        expect(findings).toHaveLength(0);
    });
});

describe('F7: WikiDecayService', () => {
    const now = Date.now();
    const oldUnit = unit({
        id: 'old',
        kind: 'note',
        createdAt: new Date(now - 300 * 86_400_000).toISOString(),
    });
    const freshUnit = unit({
        id: 'fresh',
        kind: 'claim',
        createdAt: new Date(now - 10 * 86_400_000).toISOString(),
    });

    it('свежий claim держит высокий score', () => {
        const svc = new WikiDecayService();
        expect(svc.score(freshUnit, now)).toBeGreaterThan(0.7);
        expect(svc.score(oldUnit, now)).toBeLessThan(0.5);
    });

    it('candidates возвращает только старые слабые', () => {
        const svc = new WikiDecayService();
        const cands = svc.candidates([oldUnit, freshUnit], { now });
        expect(cands.map((u) => u.id)).toEqual(['old']);
    });
});

describe('F8: WikiBrainMcpServer', () => {
    const deps = {
        query: {
            search: vi.fn(async () => [
                {
                    page: { slug: 'agents', frontmatter: { title: 'Agents' } },
                    snippet: 'agents overview',
                },
            ]),
            getBySlug: vi.fn(async () => ({ slug: 'agents', body: 'hello body' })),
        },
        units: {
            addUnit: vi.fn(async (input) => unit({ id: 'ku-new', text: input.text })),
        },
        graph: {
            listProject: vi.fn(async () => ({ nodes: [{ id: 'n1' }], edges: [] })),
            neighbors: vi.fn(async () => []),
            findByRelation: vi.fn(async () => []),
        },
    } as never;

    it('tools(): возвращает 4 инструмента', () => {
        const server = new WikiBrainMcpServer(deps);
        expect(server.tools().map((t) => t.name)).toEqual([
            'wiki.search',
            'wiki.read_page',
            'wiki.graph_query',
            'wiki.add_knowledge_unit',
        ]);
    });

    it('handle(wiki.search) возвращает текст результатов', async () => {
        const server = new WikiBrainMcpServer(deps);
        const res = await server.handle('wiki.search', { query: 'agents' });
        expect(res.content[0]?.text).toContain('[[agents]]');
    });

    it('handle(wiki.add_knowledge_unit) создаёт юнит', async () => {
        const server = new WikiBrainMcpServer(deps);
        const res = await server.handle('wiki.add_knowledge_unit', {
            pageId: 'p1',
            text: 'claim',
        });
        expect(res.content[0]?.text).toContain('ku-new');
    });

    it('handle(неизвестный) → isError', async () => {
        const server = new WikiBrainMcpServer(deps);
        const res = await server.handle('foo', {});
        expect(res.isError).toBe(true);
    });
});
