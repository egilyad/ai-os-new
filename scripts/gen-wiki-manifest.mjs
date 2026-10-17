// Generator: machine-readable documentation manifest for agents and the site.
// Run: node scripts/gen-wiki-manifest.mjs  (output: docs/manifest.json)
// Deterministic (no timestamps) so CI can gate it: regenerate must equal the
// committed file. Entities: sections, articles (from the wiki corpus), panels
// (from the route registries + route-imports).
import { writeFileSync, readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { register } from 'tsx/esm/api';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve, relative } from 'path';
import { parseNavSections, techniqueComponents, routeImportComponents, testsFor, panelArticles } from './lib/route-nav.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
register();

const { WIKI_ARTICLES, WIKI_SECTIONS } = await import(
    pathToFileURL(resolve(root, 'src/components/WikiPanel/wiki-articles.ts')).href
);

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
    reviewed: a.reviewed ?? null,
    tests: [...new Set((a.sources ?? []).flatMap(testsFor))],
}));

// ---- panels ----
const panelArticle = panelArticles();
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

// ---- audits: reports in docs/audits/ plus the existing files they mention ----
// These are navigation edges ("the report talks about this file"), not proof of
// a causal fix; tests are only the ones physically co-located with the source.
function walkMd(dir, acc = []) {
    for (const entry of readdirSync(dir)) {
        const abs = resolve(dir, entry);
        if (statSync(abs).isDirectory()) walkMd(abs, acc);
        else if (entry.endsWith('.md')) acc.push(abs);
    }
    return acc;
}

const auditRoot = resolve(root, 'docs/audits');
const audits = existsSync(auditRoot)
    ? walkMd(auditRoot)
          .filter((abs) => abs.split(/[\\/]/).pop() !== 'README.md')
          .sort()
          .map((abs) => {
              const path = relative(root, abs).replace(/\\/g, '/');
              const text = readFileSync(abs, 'utf8');
              const title = (text.match(/^#\s+(.+)$/m)?.[1] ?? path.split('/').pop()).trim();
              const date = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? null;
              const mentions = [
                  ...new Set(
                      [...text.matchAll(/(?:^|[`\s(])(src\/[\w./-]+\.(?:tsx?|ts))/g)].map((m) => m[1]),
                  ),
              ]
                  .filter((p) => existsSync(resolve(root, p)))
                  .sort();
              const tests = [...new Set(mentions.flatMap(testsFor))].sort();
              const slug = path.replace(/^docs\/audits\//, '').replace(/\.md$/, '').replace(/\//g, '--');
              return { id: `audit:${slug}`, type: 'audit', path, title, date, mentions, tests };
          })
    : [];

const manifest = {
    version: 1,
    source: 'scripts/gen-wiki-manifest.mjs',
    sections,
    articles,
    panels,
    audits,
};

writeFileSync(resolve(root, 'docs/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
    `manifest: ${articles.length} articles, ${panels.length} panels, ${sections.length} sections, ${audits.length} audits -> docs/manifest.json`,
);
