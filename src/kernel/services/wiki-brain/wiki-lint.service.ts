import type { IWikiLintService } from '../../contracts/wiki-brain/wiki-lint.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiLintIssue } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';

function wikilinks(body: string): string[] {
    const found: string[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
        found.push(m[1].trim().toLowerCase());
    }
    return found;
}

export class WikiLintService implements IWikiLintService {
    constructor(private store: IWikiStore) {}

    async runAll(): Promise<TWikiLintIssue[]> {
        const issues: TWikiLintIssue[] = [];
        const now = new Date().toISOString();
        const pages = await this.store.listPages({ limit: 10000 });
        const slugs = new Set(pages.map((p) => p.slug));

        for (const page of pages) {
            for (const target of wikilinks(page.body)) {
                if (!slugs.has(target)) {
                    issues.push({
                        id: wikiId('lint'),
                        rule: 'dead-wikilink',
                        severity: 'warn',
                        pageId: page.id,
                        fromSlug: page.slug,
                        toSlug: target,
                        message: `${page.slug} links to missing [[${target}]]`,
                        detectedAt: now,
                    });
                }
            }
            const incoming = (await this.store.linksTo(page.slug)).length;
            if (incoming === 0 && page.slug !== 'index' && page.slug !== 'overview') {
                issues.push({
                    id: wikiId('lint'),
                    rule: 'orphan-page',
                    severity: 'info',
                    pageId: page.id,
                    fromSlug: page.slug,
                    message: `${page.slug} has no incoming links`,
                    detectedAt: now,
                });
            }
        }

        await this.store.clearIssuesForRule('dead-wikilink');
        await this.store.clearIssuesForRule('orphan-page');
        for (const issue of issues) await this.store.putIssue(issue);
        return issues;
    }

    async runForPage(pageId: string): Promise<TWikiLintIssue[]> {
        const page = await this.store.getPage(pageId);
        if (!page) return [];
        const issues = await this.store.listIssues();
        return issues.filter((i) => i.pageId === pageId);
    }

    async listIssues(opts?: { severity?: TWikiLintIssue['severity'] }) {
        return this.store.listIssues(opts);
    }
}
