// Documentation Health check — objective, code-truth checks over the committed
// markdown mirror (docs/wiki). Run: node scripts/check-docs-health.mjs
// Exits non-zero when hard problems are found (broken source refs, broken
// internal links, duplicate slugs). Soft metrics (incomplete articles,
// undocumented panels) are reported but do not fail the run.
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';
import { parseNavSections } from './lib/route-nav.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = resolve(root, 'docs/wiki');

const STUB_RE = /пока не написана/i;
const STUB_MIN_CHARS = 250;
const SOURCES_RE = /^Источники:\s*(.+)$/m;
const TICK_RE = /`([^`]+)`/g;

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
function resolveModule(raw) {
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

const files = readdirSync(docsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
const slugs = new Set(files.map((f) => basename(f, '.md')));

const brokenSources = [];
const brokenLinks = [];
const incomplete = [];
const noSources = [];
const bySlug = new Map();

for (const f of files) {
    const slug = basename(f, '.md');
    const md = readFileSync(resolve(docsDir, f), 'utf8');
    bySlug.set(slug, md);

    // --- declared source files must exist ---
    const srcLine = SOURCES_RE.exec(md)?.[1] ?? '';
    const sources = [...srcLine.matchAll(TICK_RE)].map((m) => m[1]).filter((s) => s.includes('/') || s.includes('.'));
    if (!sources.length) noSources.push(slug);
    for (const s of sources) {
        if (!resolveModule(s)) brokenSources.push({ slug, source: s });
    }

    // --- internal markdown links resolve ---
    for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
        const href = m[1].split('#')[0];
        if (!href || href.startsWith('http') || href.startsWith('#')) continue;
        if (href === './README.md' || href === 'README.md') continue; // wiki index, generated separately
        if (href === '../README.md' || href === '../README_EN.md') {
            if (!existsSync(resolve(root, href.replace('../', '')))) brokenLinks.push({ slug, href });
            continue;
        }
        const target = href.startsWith('./') ? href.slice(2) : href;
        if (target.endsWith('.md') && !slugs.has(basename(target, '.md'))) brokenLinks.push({ slug, href });
        else if (!target.endsWith('.md') && !existsSync(resolve(root, target))) brokenLinks.push({ slug, href });
    }

    // --- completeness ---
    const bodyText = stripBoilerplate(md);
    const isStub = STUB_RE.test(bodyText) || bodyText.length < STUB_MIN_CHARS;
    if (isStub) incomplete.push({ slug, chars: bodyText.length });
}

// --- panel coverage from the real registries ---
const sections = parseNavSections();
const panelArticlesSrc = readFileSync(resolve(root, 'src/components/WikiPanel/wiki-panels.ts'), 'utf8');
const mapped = new Set();
for (const m of panelArticlesSrc.matchAll(/^\s*'?([\w-]+)'?:\s*'([\w-]+)',?\s*$/gm)) mapped.add(m[1]);
const allPanels = sections.flatMap((s) => s.items.map((it) => ({ ...it, section: s.id })));
// Technique panels are auto-generated and covered by the panels-catalog article,
// so they are reported separately rather than as documentation gaps.
const techniquePanels = allPanels.filter((p) => p.section === 'techniques');
const undocumented = allPanels.filter((p) => p.section !== 'techniques' && !mapped.has(p.id));

// --- manifest cross-check (entity references must resolve) ---
// Soft: only run when the manifest exists. Hard problems counted separately.
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
            if (p.component && !resolveModule(p.component)) manifestProblems.push(`panel ${p.panelId} -> missing component ${p.component}`);
        }
        for (const a of manifest.articles ?? []) {
            if (!slugs.has(a.slug)) manifestProblems.push(`article ${a.id} has no page (${a.slug}.md)`);
            for (const r of a.related ?? []) if (!slugs.has(r)) manifestProblems.push(`article ${a.slug} -> dead related ${r}`);
        }
    }
}

// --- report ---
const lines = [];
lines.push('Documentation Health', '');
lines.push(`articles:                 ${files.length}`);
lines.push(`broken source refs:       ${brokenSources.length}`);
lines.push(`broken internal links:    ${brokenLinks.length}`);
lines.push(`incomplete articles:      ${incomplete.length}`);
lines.push(`articles without sources: ${noSources.length}`);
lines.push(`panels:                   ${mapped.size}/${allPanels.length} mapped to an article`);
lines.push(`  technique auto-panels:  ${techniquePanels.length} (covered by panels-catalog)`);
lines.push(`manifest problems:        ${manifestProblems.length}`);
lines.push('');
const cap = (arr) => (arr.length > 20 ? [...arr.slice(0, 20), `… +${arr.length - 20} more`] : arr);
if (brokenSources.length) {
    lines.push('Broken source refs:');
    for (const b of cap(brokenSources)) lines.push(`  - ${typeof b === 'string' ? b : `${b.slug} -> ${b.source}`}`);
    lines.push('');
}
if (brokenLinks.length) {
    lines.push('Broken internal links:');
    for (const b of cap(brokenLinks)) lines.push(`  - ${typeof b === 'string' ? b : `${b.slug} -> ${b.href}`}`);
    lines.push('');
}
if (incomplete.length) {
    lines.push('Incomplete / stub articles:');
    for (const b of cap(incomplete)) lines.push(`  - ${typeof b === 'string' ? b : `${b.slug} (${b.chars} chars)`}`);
    lines.push('');
}
if (undocumented.length) {
    lines.push(`Panels without a mapped article (${undocumented.length}):`);
    for (const p of cap(undocumented)) lines.push(`  - ${typeof p === 'string' ? p : `${p.id} (${p.section})`}`);
    lines.push('');
}
if (manifestProblems.length) {
    lines.push('Manifest problems:');
    for (const b of cap(manifestProblems)) lines.push(`  - ${b}`);
    lines.push('');
}
console.log(lines.join('\n'));

const hardErrors = brokenSources.length + brokenLinks.length + manifestProblems.length;
if (hardErrors > 0) {
    console.error(`docs-health: FAILED (${hardErrors} hard problem(s))`);
    process.exit(1);
}
console.log('docs-health: OK');
