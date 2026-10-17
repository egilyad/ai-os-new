// Stage 7 generator: the knowledge graph. Turns docs/manifest.json (articles,
// panels, sources, tests, related) into a machine-readable node/edge graph
// (docs/graph.json) for agents, plus a human article (wiki-graph.ts) that shows
// the structure, the hub articles and isolated ones.
// Run: node scripts/gen-docs-graph.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const genDir = resolve(root, 'src/generated');
mkdirSync(genDir, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve(root, 'docs/manifest.json'), 'utf8'));
const articleSlugs = new Set(manifest.articles.map((a) => a.slug));

const nodes = new Map();
const edges = [];
const addNode = (id, type, label, extra = {}) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label, ...extra });
};
const addEdge = (from, to, kind) => edges.push({ from, to, kind });

for (const a of manifest.articles) {
    addNode(a.id, 'article', a.title, { section: a.section, status: a.status });
    for (const r of a.related ?? []) {
        if (articleSlugs.has(r)) addEdge(a.id, `wiki:${r}`, 'related');
    }
    for (const s of a.sources ?? []) {
        addNode(`file:${s}`, 'code', s);
        addEdge(a.id, `file:${s}`, 'source');
    }
    for (const t of a.tests ?? []) {
        addNode(`file:${t}`, 'test', t);
        addEdge(a.id, `file:${t}`, 'test');
    }
}
for (const p of manifest.panels) {
    addNode(p.id, 'panel', p.label ?? p.panelId, { section: p.section, route: p.route });
    if (p.article && articleSlugs.has(p.article)) addEdge(p.id, `wiki:${p.article}`, 'documents');
}
for (const a of manifest.audits ?? []) {
    addNode(a.id, 'audit', a.title, { path: a.path, date: a.date });
    for (const m of a.mentions ?? []) addEdge(a.id, `file:${m}`, 'audit_mention');
    for (const t of a.tests ?? []) addEdge(a.id, `file:${t}`, 'audit_test');
}

// dedupe + stable order
const edgeKey = (e) => `${e.from}\u0000${e.to}\u0000${e.kind}`;
const uniqueEdges = [...new Map(edges.map((e) => [edgeKey(e), e])).values()].sort(
    (a, b) => edgeKey(a).localeCompare(edgeKey(b)),
);
const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));

const degree = new Map();
for (const e of uniqueEdges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
}
const byType = {};
for (const n of nodeList) byType[n.type] = (byType[n.type] ?? 0) + 1;
const byKind = {};
for (const e of uniqueEdges) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;

const articleHubs = nodeList
    .filter((n) => n.type === 'article')
    .map((n) => ({ slug: n.id.slice(5), title: n.label, degree: degree.get(n.id) ?? 0 }))
    .sort((a, b) => b.degree - a.degree);
const hubs = articleHubs.slice(0, 15);
const isolated = articleHubs.filter((h) => h.degree === 0);

const graph = {
    version: 1,
    generatedBy: 'scripts/gen-docs-graph.mjs',
    source: 'docs/manifest.json',
    stats: { nodes: nodeList.length, edges: uniqueEdges.length, byType, byKind },
    nodes: nodeList,
    edges: uniqueEdges,
};
writeFileSync(resolve(root, 'docs/graph.json'), JSON.stringify(graph, null, 2) + '\n', 'utf8');

const md = [];
md.push('# Граф знаний');
md.push('');
md.push('> Автосгенерировано `scripts/gen-docs-graph.mjs` из `docs/manifest.json`. Машиночитаемая версия — `docs/graph.json`. Не редактировать вручную.');
md.push('');
md.push('Сущности и их связи как граф: статьи, панели, аудиты и файлы кода/тестов. Агенты читают');
md.push('`docs/graph.json` для переходов между сущностями; люди — эту страницу. Правила связей — [[docs-standard]].');
md.push('');
md.push('## Состав графа');
md.push('');
md.push('| Тип узла | Узлов |');
md.push('| --- | --- |');
for (const t of Object.keys(byType).sort()) md.push(`| ${t} | ${byType[t]} |`);
md.push('');
md.push('| Тип связи | Рёбер |');
md.push('| --- | --- |');
for (const k of Object.keys(byKind).sort()) md.push(`| ${k} | ${byKind[k]} |`);
md.push('');
md.push(`Всего: **${nodeList.length}** узлов, **${uniqueEdges.length}** рёбер.`);
md.push('');
md.push('Виды связей: `related` (статья → статья), `source` (статья → файл кода),');
md.push('`test` (статья → тест), `documents` (панель → статья), `audit_mention`');
md.push('(аудит → файл, о котором он говорит), `audit_test` (аудит → смежный тест).');
md.push('');
md.push('Связи аудитов — навигационные: отчёт «упоминает» файл, это не доказательство');
md.push('причинного исправления. Для проверки открывайте исходный отчёт по `path`.');
md.push('');
md.push('## Самые связанные статьи');
md.push('');
md.push('Узлы-хабы (по числу связей) — точки входа для навигации:');
md.push('');
md.push('| Статья | Связей |');
md.push('| --- | --- |');
for (const h of hubs) md.push(`| [[${h.slug}]] | ${h.degree} |`);
md.push('');
md.push(`## Изолированные статьи (${isolated.length})`);
md.push('');
if (!isolated.length) md.push('Нет — у каждой статьи есть хотя бы одна связь.');
else for (const i of isolated) md.push(`- [[${i.slug}]]`);
md.push('');
md.push('## Поиск и переходы');
md.push('');
md.push('- Полнотекстовый поиск — на сайте `/wiki/` и в панели Wiki; фильтры по разделам.');
md.push('- Переходы «сущность → сущность» — из этого графа и `docs/graph.json`.');
md.push('- Плоский машинный индекс — `docs/manifest.json` ([[docs-inventory]] описывает состав).');
md.push('');
md.push('## Как это считается');
md.push('');
md.push('- Узлы и связи берутся из `docs/manifest.json` (статьи, панели, источники, тесты, related).');
md.push('- `related` добавляется только для существующих статей; дубликаты рёбер удаляются.');
md.push('- Источник: `scripts/gen-docs-graph.mjs` → `docs/graph.json` → эта страница.');
md.push('');

writeFileSync(
    resolve(genDir, 'wiki-graph.ts'),
    `// Generated by node scripts/gen-docs-graph.mjs — do not hand-edit.\nexport const GRAPH_MARKDOWN: string = ${JSON.stringify(md.join('\n'))};\n`,
);
console.log(
    `graph: ${nodeList.length} nodes, ${uniqueEdges.length} edges, ${isolated.length} isolated -> docs/graph.json + src/generated/wiki-graph.ts`,
);
