// Generator: the "Coverage matrix" wiki article — a single table that ties
// every system object to its code, its wiki article, its co-located tests and a
// verification level. It answers "what have we actually documented and how far
// is it proven?" without hand-maintained numbers.
// Run: node scripts/gen-wiki-coverage.mjs
// Output: src/generated/wiki-coverage.ts -> COVERAGE_MARKDOWN
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { register } from 'tsx/esm/api';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import {
    testsFor,
    panelArticles,
    parseNavSections,
    techniqueComponents,
    routeImportComponents,
} from './lib/route-nav.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const genDir = resolve(root, 'src/generated');
mkdirSync(genDir, { recursive: true });
register();

const { WIKI_ARTICLES, WIKI_SECTIONS } = await import(
    pathToFileURL(resolve(root, 'src/components/WikiPanel/wiki-articles.ts')).href
);

// --- verification levels (honest, code-truth where possible) ---
// documented     — page exists.
// source-checked — declares at least one code path that resolves.
// test-backed    — has a co-located test next to a declared source.
// manual-verified— reviewed marker set on the article (human pass).
// test-passed    — only known after CI runs; not asserted here.
function levelOf(a) {
    const sources = a.sources ?? [];
    const tests = [...new Set(sources.flatMap(testsFor))];
    const levels = [];
    if (sources.length) levels.push('source-checked');
    if (tests.length) levels.push('test-backed');
    if (a.reviewed) levels.push('manual-verified');
    return { sources, tests, levels, status: a.freshness };
}

const enriched = WIKI_ARTICLES.map((a) => ({ ...a, ...levelOf(a) }));
const total = enriched.length;
const withSources = enriched.filter((a) => a.sources.length).length;
const withTests = enriched.filter((a) => a.tests.length).length;
const reviewed = enriched.filter((a) => a.reviewed).length;

const sectionTitle = new Map(WIKI_SECTIONS.map((s) => [s.id, s.title]));

// --- panels: id -> route -> component -> tests -> article ---
const panelArticle = panelArticles();
const components = { ...routeImportComponents(), ...techniqueComponents() };
const allPanels = parseNavSections().flatMap((s) => s.items.map((it) => ({ ...it, section: s.id })));
const livePanels = allPanels.filter((p) => p.section !== 'techniques');
const withComponent = livePanels.filter((p) => components[p.id]);
const panelsWithTests = withComponent.filter((p) => testsFor(components[p.id]).length);
const unmappedPanels = livePanels.filter((p) => !panelArticle[p.id]);
const panelsNoTest = withComponent.filter((p) => !testsFor(components[p.id]).length);

const md = [];
md.push('# Матрица покрытия');
md.push('');
md.push('> Автосгенерировано `scripts/gen-wiki-coverage.mjs` из `WIKI_ARTICLES`, реестра маршрутов и `docs/manifest.json`.');
md.push('> Не редактировать вручную. Одна строка — один объект системы: код → статья → тесты → статус.');
md.push('');
md.push('Цель страницы — не перечислить статьи, а показать, **что и насколько доказано**.');
md.push('Наличие страницы ещё не значит, что она сверена с кодом; наличие теста рядом с источником');
md.push('ещё не значит, что тест проверяет именно то, что утверждает статья.');
md.push('');
md.push('## Уровни проверки');
md.push('');
md.push('| Уровень | Что означает | Как вычисляется |');
md.push('| --- | --- | --- |');
md.push(`| documented | статья написана | есть страница в корпусе |`);
md.push(`| source-checked | утверждения привязаны к коду | в статье есть строка «Источники:» и пути резолвятся |`);
md.push(`| test-backed | рядом с источником есть тест | co-located \`*.test.ts(x)\` у файла из источников |`);
md.push(`| manual-verified | просмотрено человеком | выставлен маркер \`reviewed\` |`);
md.push(`| test-passed | тесты реально прогнаны | только по CI, здесь не утверждается |`);
md.push('');
md.push('## Сводка');
md.push('');
md.push('| Показатель | Значение |');
md.push('| --- | --- |');
md.push(`| Статей всего | ${total} |`);
md.push(`| source-checked (есть источники) | ${withSources} |`);
md.push(`| test-backed (есть co-located тесты) | ${withTests} |`);
md.push(`| manual-verified (reviewed) | ${reviewed} |`);
md.push(`| Панелей (обычных) | ${livePanels.length} |`);
md.push(`| Панелей с компонентом | ${withComponent.length} |`);
md.push(`| Панелей с тестами у компонента | ${panelsWithTests.length} |`);
md.push(`| Панелей без статьи | ${unmappedPanels.length} |`);
md.push(`| Авто-панелей техник | ${allPanels.length - livePanels.length} (покрыты [[panels-catalog]]) |`);
md.push('');

md.push('## По разделам');
md.push('');
md.push('| Раздел | Статей | source-checked | test-backed |');
md.push('| --- | ---: | ---: | ---: |');
for (const s of WIKI_SECTIONS) {
    const arts = enriched.filter((a) => a.section === s.id);
    if (!arts.length) continue;
    md.push(
        `| ${sectionTitle.get(s.id)} | ${arts.length} | ${arts.filter((a) => a.sources.length).length} | ${arts.filter((a) => a.tests.length).length} |`,
    );
}
md.push('');

// --- domains from the machine manifest ---
if (existsSync(resolve(root, 'docs/manifest.json'))) {
    const manifest = JSON.parse(readFileSync(resolve(root, 'docs/manifest.json'), 'utf8'));
    md.push('## Домены кода → статья');
    md.push('');
    md.push('| Домен | Объектов | Статья | Источник / генератор |');
    md.push('| --- | ---: | --- | --- |');
    for (const c of manifest.catalogs ?? []) {
        const count = typeof c.count === 'number' ? String(c.count) : '—';
        const origin = c.generator ?? c.source ?? '—';
        md.push(`| ${c.title} | ${count} | [[${c.article}]] | \`${origin}\` |`);
    }
    if (manifest.audits?.length) {
        md.push(`| Аудиты | ${manifest.audits.length} | [[dev-history]] | \`docs/audits/\` |`);
    }
    md.push(`| Панели | ${livePanels.length} | [[panels-catalog]] | \`src/route-registry-*.ts\` |`);
    md.push('');
}

// --- gaps: real, ordered by importance ---
md.push('## Что не подтверждено тестами');
md.push('');
md.push(`Компоненты панелей без co-located тестов: **${panelsNoTest.length}** из ${withComponent.length}.`);
md.push(
    `Статьи, помеченные verified, но без co-located тестов: **${enriched.filter((a) => a.status === 'verified' && !a.tests.length).length}**.`,
);
md.push('');
const sample = panelsNoTest.slice(0, 20);
if (sample.length) {
    md.push('Примеры панелей без тестов у компонента:');
    md.push('');
    for (const p of sample) md.push(`- \`${p.id}\` → \`${components[p.id]}\``);
    md.push('');
}
if (unmappedPanels.length) {
    md.push('Панели без статьи:');
    md.push('');
    for (const p of unmappedPanels.slice(0, 20)) md.push(`- \`${p.id}\` (${p.section})`);
    md.push('');
}
md.push('## Как это проверяется');
md.push('');
md.push('- Генератор: `scripts/gen-wiki-coverage.mjs` → `src/generated/wiki-coverage.ts`.');
md.push('- Данные: `WIKI_ARTICLES` (корпус), `scripts/lib/route-nav.mjs` (панели/тесты), `docs/manifest.json`.');
md.push('- Смежные страницы: [[docs-health]], [[dev-checks]], [[docs-standard]], [[docs-inventory]], [[dev-graph]].');

writeFileSync(
    resolve(genDir, 'wiki-coverage.ts'),
    `// Generated by node scripts/gen-wiki-coverage.mjs — do not hand-edit.\nexport const COVERAGE_MARKDOWN: string = ${JSON.stringify(md.join('\n'))};\n`,
);
console.log(
    `coverage matrix: ${total} articles (${withSources} sourced, ${withTests} test-backed), ${livePanels.length} panels (${panelsNoTest.length} without tests) -> src/generated/wiki-coverage.ts`,
);
