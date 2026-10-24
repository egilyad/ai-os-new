import type { IWikiLintService } from '../../contracts/wiki-brain/wiki-lint.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiLintIssue, TWikiPage } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';

function wikilinks(body: string): string[] {
    const found: string[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
        const capture = m[1];
        if (capture) found.push(capture.trim().toLowerCase());
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
            if (!page.frontmatter.slug || !page.frontmatter.title || !page.frontmatter.type) {
                issues.push({
                    id: wikiId('lint'),
                    rule: 'missing-frontmatter',
                    severity: 'error',
                    pageId: page.id,
                    message: `${page.id} is missing required frontmatter fields`,
                    detectedAt: now,
                });
            }
        }

        const linkRows: Array<{ from: TWikiPage; to: (typeof pages)[number] }> = [];
        for (const page of pages) {
            const out = await this.store.linksFrom(page.slug);
            for (const link of out) {
                const target = await this.store.getPageBySlug(link.toSlug);
                if (target) linkRows.push({ from: page, to: target });
            }
        }
        for (const { from, to } of linkRows) {
            const back = await this.store.linksFrom(to.slug);
            if (back.some((b) => b.toSlug === from.slug) && from.frontmatter.type !== 'overview') {
                issues.push({
                    id: wikiId('lint'),
                    rule: 'circular-link',
                    severity: 'warn',
                    fromSlug: from.slug,
                    toSlug: to.slug,
                    message: `${from.slug} ↔ ${to.slug} form a two-way link`,
                    detectedAt: now,
                });
            }
        }

        const byAlias = new Map<string, TWikiPage[]>();
        for (const page of pages) {
            for (const alias of page.frontmatter.aliases) {
                const key = alias.trim().toLowerCase();
                if (!key) continue;
                const bucket = byAlias.get(key) ?? [];
                bucket.push(page);
                byAlias.set(key, bucket);
            }
        }
        for (const [alias, bucket] of byAlias) {
            if (bucket.length > 1) {
                issues.push({
                    id: wikiId('lint'),
                    rule: 'duplicate-entity',
                    severity: 'warn',
                    pageId: bucket[0]!.id,
                    message: `alias "${alias}" is shared by ${bucket.map((p) => p.slug).join(', ')}`,
                    detectedAt: now,
                });
            }
        }

        const rules = ['dead-wikilink', 'orphan-page', 'missing-frontmatter', 'circular-link', 'duplicate-entity'] as const;
        for (const rule of rules) await this.store.clearIssuesForRule(rule);
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
