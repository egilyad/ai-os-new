import type { TWikiSource } from '../../contracts/wiki-brain/types';
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
    ArxivProvider,
    LiteratureFetcherService,
    PerplexityProvider,
    WebStubProvider,
    type LiteratureFetchOptions,
} from './literature-fetcher-service';

const SAMPLE_ARXIV_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2611.00001</id>
    <title>Diffusion Models for Agents</title>
    <summary>We study diffusion-based planning and execution.</summary>
    <author><name>Alice Smith</name></author>
    <author><name>Bob Jones</name></author>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2611.00002</id>
    <title>Another Paper</title>
    <summary>More research.</summary>
  </entry>
</feed>`;

describe('LiteratureFetcherService (F5b)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('ArxivProvider парсит feed', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, text: async () => SAMPLE_ARXIV_XML })),
        );
        const provider = new ArxivProvider();
        const papers = await provider.fetch('diffusion');
        expect(papers).toHaveLength(2);
        expect(papers[0]).toMatchObject({
            title: 'Diffusion Models for Agents',
            authors: ['Alice Smith', 'Bob Jones'],
            source: 'arxiv',
        });
    });

    it('сервис агрегирует провайдеров и listProviders', async () => {
        const svc = new LiteratureFetcherService({}, [
            {
                id: 'a',
                label: 'A',
                fetch: async (_q: string, _o?: LiteratureFetchOptions) => [
                    {
                        id: '1',
                        title: 'x',
                        summary: '',
                        url: '',
                        authors: [],
                        source: 'arxiv' as const,
                    },
                ],
            },
            { id: 'b', label: 'B', fetch: async (_q: string, _o?: LiteratureFetchOptions) => [] },
        ]);
        expect(svc.listProviders()).toEqual([
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
        ]);
        const results = await svc.fetch('q');
        expect(results).toHaveLength(2);
        expect(results[0]?.papers).toHaveLength(1);
    });

    it('ingestAsSources пишет TWikiSource и пропускает дубликаты', async () => {
        const store = {
            getSourceBySha256: vi.fn(async (_sha: string) => undefined),
            putSource: vi.fn(async (_s: TWikiSource) => undefined),
        };
        const svc = new LiteratureFetcherService({ store: store as never }, []);
        const count = await svc.ingestAsSources(
            [
                {
                    id: 'p1',
                    title: 'T',
                    summary: 'S',
                    url: 'http://x',
                    authors: [],
                    source: 'arxiv' as const,
                },
            ],
            'proj-1',
        );
        expect(count).toBe(1);
        expect(store.putSource).toHaveBeenCalledTimes(1);
        expect(store.putSource.mock.calls[0]?.[0]).toMatchObject({
            kind: 'url',
            title: 'T',
            projectId: 'proj-1',
        });
    });

    it('WebStubProvider возвращает пусто', async () => {
        const p = new WebStubProvider();
        expect(await p.fetch('q')).toEqual([]);
    });

    it('PerplexityProvider без ключа возвращает пусто', async () => {
        const p = new PerplexityProvider('');
        expect(await p.fetch('q')).toEqual([]);
    });

    it('PerplexityProvider с ключом парсит ответ', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Deep research result.' } }],
                }),
            })),
        );
        const p = new PerplexityProvider('test-key');
        const papers = await p.fetch('agents survey');
        expect(papers).toHaveLength(1);
        expect(papers[0]?.summary).toContain('Deep research result.');
    });
});
