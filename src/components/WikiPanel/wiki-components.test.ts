import { describe, expect, it } from 'vitest';
import { WIKI_ARTICLES } from './wiki-articles';
import { COMPONENT_ARTICLES } from './wiki-components';

const slugSet = new Set(WIKI_ARTICLES.map((a) => a.slug));
const validFreshness = new Set(['verified', 'documented', 'needs-check', 'not-implemented']);

// The section index article describes the map and intentionally has a
// different shape than the per-component articles.
const OVERVIEW_SLUG = 'comp-overview';
const REQUIRED_SECTIONS = ['## Назначение', '## Реализация', '## Связи', '## Состояние'];

describe('wiki components completeness', () => {
    it('has component articles', () => {
        expect(COMPONENT_ARTICLES.length).toBeGreaterThan(0);
    });

    it('uses the comp- prefix, unique slugs and the components section', () => {
        const bad: string[] = [];
        const seen = new Set<string>();
        for (const a of COMPONENT_ARTICLES) {
            if (!a.slug.startsWith('comp-')) bad.push(`${a.slug}: неверный префикс`);
            if (seen.has(a.slug)) bad.push(`${a.slug}: дубликат`);
            seen.add(a.slug);
            if (a.section !== 'components') bad.push(`${a.slug}: section=${a.section}`);
        }
        expect(bad).toEqual([]);
    });

    it('gives every article sources, tags, related and a substantial body', () => {
        const bad: string[] = [];
        for (const a of COMPONENT_ARTICLES) {
            if (a.sources.length === 0) bad.push(`${a.slug}: нет источников`);
            if (a.tags.length === 0) bad.push(`${a.slug}: нет тегов`);
            if (a.related.length === 0) bad.push(`${a.slug}: нет related`);
            if (a.body.trim().length < 250) bad.push(`${a.slug}: тело короче 250 символов`);
        }
        expect(bad).toEqual([]);
    });

    it('keeps the required sections on every non-index article', () => {
        const bad: string[] = [];
        for (const a of COMPONENT_ARTICLES) {
            if (a.slug === OVERVIEW_SLUG) continue;
            for (const heading of REQUIRED_SECTIONS) {
                if (!a.body.includes(heading)) bad.push(`${a.slug}: нет «${heading}»`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('uses a valid freshness value', () => {
        const bad = COMPONENT_ARTICLES.filter((a) => !validFreshness.has(a.freshness)).map((a) => a.slug);
        expect(bad).toEqual([]);
    });

    it('resolves every related link', () => {
        const bad: string[] = [];
        for (const a of COMPONENT_ARTICLES) {
            for (const r of a.related) {
                if (!slugSet.has(r)) bad.push(`${a.slug} -> ${r}`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('links every component from the section index article', () => {
        const overview = COMPONENT_ARTICLES.find((a) => a.slug === OVERVIEW_SLUG);
        expect(overview).toBeDefined();
        const linked = new Set(linksIn(overview!.body));
        const missing = COMPONENT_ARTICLES.filter((a) => a.slug !== OVERVIEW_SLUG && !linked.has(a.slug)).map(
            (a) => a.slug,
        );
        expect(missing).toEqual([]);
    });

    it('keeps the component graph connected', () => {
        const adjacency = new Map<string, Set<string>>();
        for (const a of COMPONENT_ARTICLES) adjacency.set(a.slug, new Set());
        const addEdge = (from: string, to: string) => {
            if (!adjacency.has(from) || !adjacency.has(to) || from === to) return;
            adjacency.get(from)!.add(to);
            adjacency.get(to)!.add(from);
        };
        for (const a of COMPONENT_ARTICLES) {
            for (const r of a.related) addEdge(a.slug, r);
            for (const target of linksIn(a.body)) addEdge(a.slug, target);
        }
        const visited = new Set<string>([OVERVIEW_SLUG]);
        const queue = [OVERVIEW_SLUG];
        while (queue.length) {
            const current = queue.shift()!;
            for (const next of adjacency.get(current) ?? []) {
                if (!visited.has(next)) {
                    visited.add(next);
                    queue.push(next);
                }
            }
        }
        const unreachable = COMPONENT_ARTICLES.map((a) => a.slug).filter((s) => !visited.has(s));
        expect(unreachable).toEqual([]);
    });
});

function linksIn(body: string): string[] {
    return [...body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1]);
}
