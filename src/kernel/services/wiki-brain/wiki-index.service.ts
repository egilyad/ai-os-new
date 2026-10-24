import type { IWikiIndexService } from '../../contracts/wiki-brain/wiki-index.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiPage } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';

export class WikiIndexService implements IWikiIndexService {
    constructor(private store: IWikiStore) {}

    async refresh(): Promise<void> {
        const pages = await this.store.listPages({ limit: 10000 });
        const lines = ['# Index', ''];
        for (const page of pages) {
            if (page.slug === 'index') continue;
            lines.push(`- [[${page.slug}]] — ${page.frontmatter.title}`);
        }
        const body = lines.join('\n');
        const existing = await this.store.getPageBySlug('index');
        const now = new Date().toISOString();
        const indexPage: TWikiPage = {
            id: existing?.id ?? wikiId('pg'),
            slug: 'index',
            frontmatter: {
                slug: 'index',
                title: 'Index',
                type: 'index',
                sources: [],
                aliases: [],
                tags: [],
                language: 'en',
                createdAt: existing?.frontmatter.createdAt ?? now,
                updatedAt: now,
                reviewState: 'auto',
                graphIn: 0,
                graphOut: 0,
            },
            body,
            sha256: '',
            rawMarkdown: body,
        };
        await this.store.putPage(indexPage);
    }

    async getIndexPage(): Promise<TWikiPage> {
        const page = await this.store.getPageBySlug('index');
        if (page) return page;
        await this.refresh();
        const fresh = await this.store.getPageBySlug('index');
        if (!fresh) throw new Error('Wiki index page missing after refresh');
        return fresh;
    }

    async rebuildOverview(): Promise<TWikiPage> {
        const pages = await this.store.listPages({ limit: 10000 });
        const nonIndex = pages.filter((p) => p.slug !== 'index' && p.slug !== 'overview');
        const lines = ['# Overview', ''];
        for (const page of nonIndex) {
            lines.push(`- [[${page.slug}]]`);
        }
        const body = lines.join('\n');
        const now = new Date().toISOString();
        const overview: TWikiPage = {
            id: wikiId('pg'),
            slug: 'overview',
            frontmatter: {
                slug: 'overview',
                title: 'Overview',
                type: 'overview',
                sources: [],
                aliases: [],
                tags: [],
                language: 'en',
                createdAt: now,
                updatedAt: now,
                reviewState: 'auto',
                graphIn: 0,
                graphOut: 0,
            },
            body,
            sha256: '',
            rawMarkdown: body,
        };
        await this.store.putPage(overview);
        return overview;
    }
}
