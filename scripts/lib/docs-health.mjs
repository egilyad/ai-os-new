// DocsHealth: objective, code-truth checks over the committed markdown wiki
// mirror (docs/wiki). Shared by:
//   - scripts/check-docs-health.mjs     (CLI -> `npm run docs:health`)
//   - scripts/gen-wiki-docs-health.mjs  (wiki article on the same numbers)
// Keep this pure: no console output, no process.exit.
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { parseNavSections, panelArticles } from './route-nav.mjs';

const STUB_RE = /пока не написана/i;
const STUB_MIN_CHARS = 250;
const SOURCES_RE = /^Источники:\s*(.+)$/m;
const TICK_RE = /`([^`]+)`/g;

/** This article is produced from the check results — never counted by them. */
export const DOCS_HEALTH_SLUG = 'docs-health';

function stripBoilerplate(md) {
    let s = md.replace(/^<!--[\s\S]*?-->\s*/, '');
    s = s.replace(/^#\s.*$/m, '');
    s = s.replace(/^>\s.*$/gm, '');
    s = s.replace(SOURCES_RE, '');
    const rel = s.indexOf('## Связанные материалы');
    if (rel >= 0) s = s.slice(0, rel);
    s = s.replace(/\[\u2190[^\]]*\]\([^)]+\)/g, '');
    return s.trim();
}

// Resolve a declared source path the way a bundler would: allow a missing
// extension, an index file, a trailing slash, or a simple `*` glob.
function resolveModule(root, raw) {
    const p = String(raw).replace(/\/+$/, '');
    if (!p) return false;
    if (p.includes('*')) {
        const dir = p.slice(0, p.lastIndexOf('/'));
        const pat = p.slice(p.lastIndexOf('/') + 1);
        try {
            const re = new RegExp(
                '^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
            );
            return readdirSync(resolve(root, dir)).some((n) => re.test(n));
        } catch {
            return false;
        }
    }
    const abs = resolve(root, p);
    const cands = [
        abs,
        `${abs}.ts`,
        `${abs}.tsx`,
        `${abs}.js`,
        `${abs}.jsx`,
        `${abs}/index.ts`,
        `${abs}/index.tsx`,
        `${abs}/index.js`,
    ];
    return cands.some((c) => existsSync(c));
}

export function computeDocsHealth(root) {
    const docsDir = resolve(root, 'docs/wiki');
    const mirrorFiles = readdirSync(docsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
    // Every mirrored page is a valid link/manifest target...
    const slugs = new Set(mirrorFiles.map((f) => basename(f, '.md')));
    // ...but this article is generated from the results, so it is not counted
    // or length-checked (avoids a self-referential number).
    const files = mirrorFiles.filter((f) => basename(f, '.md') !== DOCS_HEALTH_SLUG);

    const brokenSources = [];
    const brokenLinks = [];
    const incomplete = [];
    const noSources = [];

    for (const f of mirrorFiles) {
        const slug = basename(f, '.md');
        const md = readFileSync(resolve(docsDir, f), 'utf8');

        // --- declared source files must exist ---
        const srcLine = SOURCES_RE.exec(md)?.[1] ?? '';
        const sources = [...srcLine.matchAll(TICK_RE)]
            .map((m) => m[1])
            .filter((s) => s.includes('/') || s.includes('.'));
        if (!sources.length) noSources.push(slug);
        for (const s of sources) {
            if (!resolveModule(root, s)) brokenSources.push({ slug, source: s });
        }

        // --- internal markdown links resolve ---
        for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
            const href = m[1].split('#')[0];
            if (!href || href.startsWith('http') || href.startsWith('#')) continue;
            if (href === './README.md' || href === 'README.md') continue; // wiki index
            if (href === '../README.md' || href === '../README_EN.md') {
                if (!existsSync(resolve(root, href.replace('../', '')))) brokenLinks.push({ slug, href });
                continue;
            }
            const target = href.startsWith('./') ? href.slice(2) : href;
            if (target.endsWith('.md') && !slugs.has(basename(target, '.md'))) brokenLinks.push({ slug, href });
            else if (!target.endsWith('.md') && !existsSync(resolve(root, target))) brokenLinks.push({ slug, href });
        }

        // --- completeness (not for the generated self-report) ---
        if (slug !== DOCS_HEALTH_SLUG) {
            const bodyText = stripBoilerplate(md);
            const isStub = STUB_RE.test(bodyText) || bodyText.length < STUB_MIN_CHARS;
            if (isStub) incomplete.push({ slug, chars: bodyText.length });
        }
    }

    // --- panel coverage from the real registries ---
    const sections = parseNavSections();
    const mapped = new Set(Object.keys(panelArticles()));
    const allPanels = sections.flatMap((s) => s.items.map((it) => ({ ...it, section: s.id })));
    // Technique panels are auto-generated and covered by the panels-catalog
    // article, so they are reported separately rather than as gaps.
    const techniquePanels = allPanels.filter((p) => p.section === 'techniques');
    const undocumented = allPanels.filter((p) => p.section !== 'techniques' && !mapped.has(p.id));

    // --- manifest cross-check (entity references must resolve) ---
    const manifestPath = resolve(root, 'docs/manifest.json');
    const manifestProblems = [];
    if (existsSync(manifestPath)) {
        let manifest = null;
        try {
            manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        } catch (e) {
            manifestProblems.push(`manifest.json is not valid JSON: ${e.message}`);
        }
        if (manifest) {
            for (const p of manifest.panels ?? []) {
                if (p.article && !slugs.has(p.article)) manifestProblems.push(`panel ${p.panelId} -> missing article ${p.article}`);
                if (p.component && !resolveModule(root, p.component)) manifestProblems.push(`panel ${p.panelId} -> missing component ${p.component}`);
            }
            for (const a of manifest.articles ?? []) {
                if (!slugs.has(a.slug)) manifestProblems.push(`article ${a.id} has no page (${a.slug}.md)`);
                for (const r of a.related ?? []) if (!slugs.has(r)) manifestProblems.push(`article ${a.slug} -> dead related ${r}`);
            }
        }
    }

    // --- README -> wiki links + RU/EN parity ---
    function readmeWikiSlugs(file) {
        const abs = resolve(root, file);
        if (!existsSync(abs)) return { slugs: [], broken: [] };
        const md = readFileSync(abs, 'utf8');
        const refs = [...md.matchAll(/\(\.?\/?docs\/wiki\/([\w-]+)\.md\)/g)]
            .map((m) => m[1])
            .filter((s) => s !== 'README');
        const uniq = [...new Set(refs)];
        return { slugs: uniq, broken: uniq.filter((s) => !slugs.has(s)) };
    }
    const readmeRu = readmeWikiSlugs('README.md');
    const readmeEn = readmeWikiSlugs('README_EN.md');
    const brokenReadmeLinks = [
        ...readmeRu.broken.map((s) => ({ file: 'README.md', slug: s })),
        ...readmeEn.broken.map((s) => ({ file: 'README_EN.md', slug: s })),
    ];
    const ruSet = new Set(readmeRu.slugs);
    const enSet = new Set(readmeEn.slugs);
    const readmeParityDiff = [
        ...[...ruSet].filter((s) => !enSet.has(s)).map((s) => `README.md only: ${s}`),
        ...[...enSet].filter((s) => !ruSet.has(s)).map((s) => `README_EN.md only: ${s}`),
    ];
    const readmeOrphans = [...slugs].filter((s) => !ruSet.has(s));

    const hardErrors =
        brokenSources.length + brokenLinks.length + manifestProblems.length + brokenReadmeLinks.length;

    return {
        articles: files.length,
        brokenSources,
        brokenLinks,
        incomplete,
        noSources,
        allPanels,
        mapped,
        techniquePanels,
        undocumented,
        manifestProblems,
        readmeRu,
        readmeEn,
        brokenReadmeLinks,
        readmeParityDiff,
        readmeOrphans,
        hardErrors,
    };
}
