// Generator: machine-readable documentation manifest for agents and the site.
// Run: node scripts/gen-wiki-manifest.mjs  (output: docs/manifest.json)
// Deterministic (no timestamps) so CI can gate it: regenerate must equal the
// committed file. Entities: sections, articles (from the wiki corpus), panels
// (from the route registries + route-imports).
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { register } from 'tsx/esm/api';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { parseNavSections, techniqueComponents, routeImportComponents } from './lib/route-nav.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
register();

const { WIKI_ARTICLES, WIKI_SECTIONS } = await import(
    pathToFileURL(resolve(root, 'src/components/WikiPanel/wiki-articles.ts')).href
);

// ---- sibling tests for a source file (conservative heuristic) ----
function testsFor(source) {
    if (!/\.(ts|tsx)$/.test(source) || source.includes('*')) return [];
    const base = source.replace(/\.(ts|tsx)$/, '');
    const cands = [`${base}.test.tsx`, `${base}.test.ts`, `${base}.smoke.test.tsx`, `${base}.test.tsx`];
    return [...new Set(cands)].filter((c) => existsSync(resolve(root, c)));
}

const articles = WIKI_ARTICLES.map((a) => ({
    id: `wiki:${a.slug}`,
    type: 'article',
    slug: a.slug,
    title: a.title,
    section: a.section,
    status: a.freshness,
    tags: a.tags ?? [],
    sources: a.sources ?? [],
    related: a.related ?? [],
    tests: [...new Set((a.sources ?? []).flatMap(testsFor))],
}));

// ---- panels ----
const panelArticlesSrc = readFileSync(resolve(root, 'src/components/WikiPanel/wiki-panels.ts'), 'utf8');
const panelArticle = {};
for (const m of panelArticlesSrc.matchAll(/^\s*'?([\w-]+)'?:\s*'([\w-]+)',?\s*$/gm)) panelArticle[m[1]] = m[2];
const components = { ...routeImportComponents(), ...techniqueComponents() };

const panels = [];
for (const section of parseNavSections()) {
    for (const item of section.items) {
        panels.push({
            id: `panel:${item.id}`,
            type: 'panel',
            panelId: item.id,
            section: section.id,
            route: item.path ?? `/${item.id}`,
            component: components[item.id] ?? null,
            article: panelArticle[item.id] ?? null,
            status: item.status ?? 'live',
        });
    }
}

const sections = WIKI_SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    articles: WIKI_ARTICLES.filter((a) => a.section === s.id).length,
}));

const manifest = {
    version: 1,
    source: 'scripts/gen-wiki-manifest.mjs',
    sections,
    articles,
    panels,
};

writeFileSync(resolve(root, 'docs/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`manifest: ${articles.length} articles, ${panels.length} panels, ${sections.length} sections -> docs/manifest.json`);
