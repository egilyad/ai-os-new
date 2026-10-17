// Documentation Health check — objective, code-truth checks over the committed
// markdown mirror (docs/wiki). Run: node scripts/check-docs-health.mjs
// Exits non-zero when hard problems are found (broken source refs, broken
// internal links, broken README->wiki links, manifest problems). Soft metrics
// (incomplete articles, undocumented panels, README RU/EN drift) are reported
// but do not fail the run. Logic lives in scripts/lib/docs-health.mjs.
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { computeDocsHealth } from './lib/docs-health.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const h = computeDocsHealth(root);

const lines = [];
lines.push('Documentation Health', '');
lines.push(`articles:                 ${h.articles}`);
lines.push(`broken source refs:       ${h.brokenSources.length}`);
lines.push(`broken internal links:    ${h.brokenLinks.length}`);
lines.push(`incomplete articles:      ${h.incomplete.length}`);
lines.push(`articles without sources: ${h.noSources.length}`);
lines.push(`panels:                   ${h.mapped.size}/${h.allPanels.length} mapped to an article`);
lines.push(`  technique auto-panels:  ${h.techniquePanels.length} (covered by panels-catalog)`);
lines.push(`manifest problems:        ${h.manifestProblems.length}`);
lines.push(`entity-model problems:    ${h.schemaProblems.length}`);
lines.push(`README wiki links:        ${h.readmeRu.slugs.length} (RU) / ${h.readmeEn.slugs.length} (EN)`);
lines.push(`README broken links:      ${h.brokenReadmeLinks.length}`);
lines.push(`README RU/EN diff:        ${h.readmeParityDiff.length} slug(s)`);
lines.push(`README wiki orphans:      ${h.readmeOrphans.length} article(s) not linked from README.md`);
lines.push('');

const cap = (arr) => (arr.length > 20 ? [...arr.slice(0, 20), `… +${arr.length - 20} more`] : arr);
const fmt = (b, fn) => (typeof b === 'string' ? b : fn(b));
if (h.brokenSources.length) {
    lines.push('Broken source refs:');
    for (const b of cap(h.brokenSources)) lines.push(`  - ${fmt(b, (x) => `${x.slug} -> ${x.source}`)}`);
    lines.push('');
}
if (h.brokenLinks.length) {
    lines.push('Broken internal links:');
    for (const b of cap(h.brokenLinks)) lines.push(`  - ${fmt(b, (x) => `${x.slug} -> ${x.href}`)}`);
    lines.push('');
}
if (h.incomplete.length) {
    lines.push('Incomplete / stub articles:');
    for (const b of cap(h.incomplete)) lines.push(`  - ${fmt(b, (x) => `${x.slug} (${x.chars} chars)`)}`);
    lines.push('');
}
if (h.undocumented.length) {
    lines.push(`Panels without a mapped article (${h.undocumented.length}):`);
    for (const p of cap(h.undocumented)) lines.push(`  - ${typeof p === 'string' ? p : `${p.id} (${p.section})`}`);
    lines.push('');
}
if (h.manifestProblems.length) {
    lines.push('Manifest problems:');
    for (const b of cap(h.manifestProblems)) lines.push(`  - ${b}`);
    lines.push('');
}
if (h.schemaProblems.length) {
    lines.push('Entity-model problems:');
    for (const b of cap(h.schemaProblems)) lines.push(`  - ${b}`);
    lines.push('');
}
if (h.brokenReadmeLinks.length) {
    lines.push('Broken README wiki links:');
    for (const b of cap(h.brokenReadmeLinks)) lines.push(`  - ${b.file} -> ${b.slug}.md`);
    lines.push('');
}
if (h.readmeParityDiff.length) {
    lines.push('README RU/EN slug diff (soft):');
    for (const b of cap(h.readmeParityDiff)) lines.push(`  - ${b}`);
    lines.push('');
}
console.log(lines.join('\n'));

if (h.hardErrors > 0) {
    console.error(`docs-health: FAILED (${h.hardErrors} hard problem(s))`);
    process.exit(1);
}
console.log('docs-health: OK');
