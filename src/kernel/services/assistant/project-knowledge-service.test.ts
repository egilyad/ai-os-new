import { describe, it, expect } from 'vitest';
import { ProjectKnowledgeService } from './project-knowledge-service';
import { WIKI_PANEL_MAP } from '../../../generated/wiki-panel-map';

function firstPanelId(): string {
    const id = Object.keys(WIKI_PANEL_MAP)[0];
    if (!id) throw new Error('the generated panel map is empty');
    return id;
}

describe('ProjectKnowledgeService', () => {
    it('builds the structural layer from the generated panel map', () => {
        const service = new ProjectKnowledgeService();
        const id = firstPanelId();

        const panel = service.panel(id);
        expect(panel).not.toBeNull();
        expect(panel?.component).toBe(WIKI_PANEL_MAP[id]);
        expect(panel?.route).toBe(`/${id}`);
        expect(service.panelsMatching().length).toBeGreaterThan(10);
    });

    it('finds panels by id fragment', () => {
        const service = new ProjectKnowledgeService();
        const hits = service.panelsMatching('agent');
        expect(hits.length).toBeGreaterThan(0);
        expect(
            hits.every((p) =>
                `${p.id} ${p.route} ${p.component ?? ''} ${p.article ?? ''}`
                    .toLowerCase()
                    .includes('agent'),
            ),
        ).toBe(true);
    });

    it('returns unknown panels as null', () => {
        const service = new ProjectKnowledgeService();
        expect(service.panel('no-such-panel')).toBeNull();
        expect(service.connections('no-such-panel')).toBeNull();
    });

    it('searches the structural layer without an article corpus', async () => {
        const service = new ProjectKnowledgeService();
        const hits = await service.search('агенту', 5);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every((h) => h.kind === 'panel')).toBe(true);
    });

    it('uses the injected article corpus and returns markdown context', async () => {
        const service = new ProjectKnowledgeService();
        service.setCorpusProvider(() => [
            {
                slug: 'assistant',
                title: 'Помощник проекта',
                section: 'assistant',
                body: 'Помощник открывает панели и создаёт агентов только с подтверждения.',
                freshness: 'fresh',
            },
        ]);

        const hits = await service.search('помощник', 5);
        const article = hits.find((h) => h.kind === 'article');
        expect(article?.id).toBe('assistant');

        const context = await service.context('помощник');
        expect(context.markdown).toContain('[SYSTEM KNOWLEDGE]');
        expect(context.markdown).toContain('Помощник проекта');
    });

    it('refreshes the corpus when the provider is replaced', async () => {
        const service = new ProjectKnowledgeService();
        service.setCorpusProvider(() => [
            { slug: 'first', title: 'Первый', section: 's', body: 'альфа' },
        ]);
        expect((await service.search('альфа', 5)).some((h) => h.id === 'first')).toBe(true);

        service.setCorpusProvider(() => [
            { slug: 'second', title: 'Второй', section: 's', body: 'бета' },
        ]);
        const after = await service.search('бета', 5);
        expect(after.some((h) => h.id === 'second')).toBe(true);
        expect(after.some((h) => h.id === 'first')).toBe(false);
    });
});
