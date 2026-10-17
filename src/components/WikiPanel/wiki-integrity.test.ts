import { describe, expect, it } from 'vitest';
import { WIKI_ARTICLES } from './wiki-articles';
import { PANEL_ARTICLES } from './wiki-panels';
import { WIKI_PANEL_MAP } from '../../generated/wiki-panel-map';

const WIKI_LINK = /\[\[([^\]]+)\]\]/g;
const slugSet = new Set(WIKI_ARTICLES.map((a) => a.slug));

describe('wiki integrity', () => {
    it('has no duplicate slugs', () => {
        const seen = new Set<string>();
        const dupes: string[] = [];
        for (const a of WIKI_ARTICLES) {
            if (seen.has(a.slug)) dupes.push(a.slug);
            seen.add(a.slug);
        }
        expect(dupes).toEqual([]);
    });

    it('resolves every [[slug]] reference', () => {
        const broken: string[] = [];
        for (const a of WIKI_ARTICLES) {
            for (const m of a.body.matchAll(WIKI_LINK)) {
                if (!slugSet.has(m[1])) broken.push(`${a.slug} -> ${m[1]}`);
            }
        }
        expect(broken).toEqual([]);
    });

    it('resolves every related slug', () => {
        const broken: string[] = [];
        for (const a of WIKI_ARTICLES) {
            for (const r of a.related) {
                if (!slugSet.has(r)) broken.push(`${a.slug} -> ${r}`);
            }
        }
        expect(broken).toEqual([]);
    });

    it('maps every panel to an existing article', () => {
        const broken: string[] = [];
        for (const [panel, slug] of Object.entries(PANEL_ARTICLES)) {
            if (!slugSet.has(slug)) broken.push(`${panel} -> ${slug}`);
        }
        expect(broken).toEqual([]);
    });

    it('covers every known panel (no honest stubs)', () => {
        const uncovered = Object.keys(WIKI_PANEL_MAP).filter((id) => !(id in PANEL_ARTICLES));
        expect(uncovered).toEqual([]);
    });
});
