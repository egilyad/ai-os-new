// Generator: Stage 1 inventory of the whole documentation tree (docs/**/*.md).
// Run: node scripts/gen-docs-inventory.mjs
// Outputs:
//   - docs/inventory.json                 (machine-readable, for agents)
//   - src/generated/wiki-docs-inventory.ts (DOCS_INVENTORY_MARKDOWN -> wiki article)
// Deterministic (no timestamps, sorted) so CI can gate it. It does NOT move or
// rewrite any document.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, relative } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = resolve(root, 'docs');

// Only git-tracked documents are in scope: keeps the inventory identical between
// a developer's machine (with untracked drafts) and CI (clean checkout).
function trackedFiles() {
    try {
        const out = execSync('git ls-files -z', { cwd: root, encoding: 'buffer' }).toString('utf8');
        return new Set(out.split('\u0000').filter(Boolean).map((p) => p.normalize('NFC')));
    } catch {
        return null;
    }
}

// Pages that are produced *from* the inventory/tests — never counted (self-reference).
const SELF_REPORTS = new Set(['docs-health', 'docs-inventory']);

const CATEGORIES = ['wiki', 'audits', 'history', 'roadmap', 'reference', 'superseded', 'active', 'new'];

// Repository-level markdown outside docs/: entry points, agent rules, changelog.
// Explicit allowlist so the inventory never drifts into generated/vendor files.
const REPO_DIRS = ['.superagents'];
const REPO_FILES = ['src/kernel/DEPENDENCY_MAP.md'];

function walk(dir, acc = []) {
    for (const entry of readdirSync(dir)) {
        const abs = resolve(dir, entry);
        const st = statSync(abs);
        if (st.isDirectory()) walk(abs, acc);
        else if (entry.endsWith('.md')) acc.push(abs);
    }
    return acc;
}

function repoDocs() {
    const acc = [];
    for (const entry of readdirSync(root)) {
        if (entry.endsWith('.md')) acc.push(resolve(root, entry));
    }
    for (const dir of REPO_DIRS) {
        const abs = resolve(root, dir);
        if (existsSync(abs)) walk(abs, acc);
    }
    for (const rel of REPO_FILES) {
        const abs = resolve(root, rel);
        if (existsSync(abs)) acc.push(abs);
    }
    return acc;
}

function categoryOf(rel) {
    if (!rel.startsWith('docs/')) return 'repo';
    const parts = rel.split('/'); // docs/... -> parts[0] === 'docs'
    const first = parts[1];
    if (parts.length === 2) return 'top';
    return CATEGORIES.includes(first) ? first : 'top';
}

function languageOf(text) {
    const cyr = (text.match(/[А-Яа-яЁё]/g) || []).length;
    const lat = (text.match(/[A-Za-z]/g) || []).length;
    if (cyr + lat < 20) return 'unknown';
    const ratio = cyr / (cyr + lat);
    if (ratio >= 0.5) return 'ru';
    if (ratio <= 0.15) return 'en';
    return 'mixed';
}

function titleOf(text, rel) {
    const m = text.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : rel.split('/').pop();
}

const tracked = trackedFiles();
const files = [...walk(docsRoot), ...repoDocs()].sort();
const items = [];
const seenHashes = new Map(); // hash -> [paths]
const seenTitles = new Map(); // normalized title -> [paths]

for (const abs of files) {
    const rel = relative(root, abs).replace(/\\/g, '/');
    if (tracked && !tracked.has(rel.normalize('NFC'))) continue; // untracked draft, not part of the repo
    if (rel.startsWith('docs/new/')) continue; // drafts live mostly outside git -> out of scope
    const slug = rel.split('/').pop().replace(/\.md$/, '');
    if (SELF_REPORTS.has(slug)) continue;
    const text = readFileSync(abs, 'utf8');
    // Size in LF-normalized bytes: the checkout line ending differs between
    // Windows (CRLF) and CI (LF), and the inventory must be identical on both.
    const bytes = Buffer.byteLength(text.replace(/\r\n/g, '\n'), 'utf8');
    const category = categoryOf(rel);
    const language = languageOf(text);
    const title = titleOf(text, rel);
    const hash = createHash('sha1').update(text.replace(/\s+/g, '').toLowerCase()).digest('hex');
    items.push({ path: rel, category, language, title, bytes, hash });
    if (!seenHashes.has(hash)) seenHashes.set(hash, []);
    seenHashes.get(hash).push(rel);
    const key = title.replace(/\s+/g, ' ').trim().toLowerCase();
    if (key) {
        if (!seenTitles.has(key)) seenTitles.set(key, []);
        seenTitles.get(key).push(rel);
    }
}

const duplicateContent = [...seenHashes.values()].filter((p) => p.length > 1).sort((a, b) => a[0].localeCompare(b[0]));
const duplicateTitles = [...seenTitles.entries()]
    .filter(([, p]) => p.length > 1)
    .map(([title, paths]) => ({ title, paths: [...paths].sort() }))
    .sort((a, b) => a.title.localeCompare(b.title));

const byCategory = {};
const byLanguage = {};
for (const it of items) {
    byCategory[it.category] = (byCategory[it.category] || 0) + 1;
    byLanguage[it.language] = (byLanguage[it.language] || 0) + 1;
}

const inventory = {
    version: 1,
    generatedBy: 'scripts/gen-docs-inventory.mjs',
    scope: 'git-tracked markdown: docs/**/*.md (excluding docs/new drafts and the self-report pages docs-health, docs-inventory) plus repository entry docs (root *.md, .superagents/**, src/kernel/DEPENDENCY_MAP.md)',
    totals: { documents: items.length, byCategory, byLanguage },
    duplicates: { content: duplicateContent, titles: duplicateTitles.map((d) => d.title) },
    documents: items.sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync(resolve(docsRoot, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');

// ---- wiki article (Russian, with provenance) ----
const catalogLinks = [
    '[[panels-catalog]]',
    '[[dev-component-catalog]]',
    '[[dev-event-catalog]]',
    '[[dev-contracts]]',
    '[[dev-store-catalog]]',
    '[[dev-i18n-catalog]]',
    '[[dev-scripts]]',
    '[[dev-tests-catalog]]',
    '[[dev-service-map]]',
].join(', ');

const md = [];
md.push('# Инвентаризация документации');
md.push('');
md.push('> Автосгенерировано `scripts/gen-docs-inventory.mjs` из отслеживаемых git-файлов `docs/**/*.md`.');
md.push('> Машиночитаемая версия — `docs/inventory.json`. Не редактировать вручную.');
md.push('');
md.push(
    `Это Этап 1 программы документации: полный учёт существующих Markdown-файлов. Всего: **${items.length}** документов (только отслеживаемые git): \`docs/**\` плюс корневые \`*.md\`, \`.superagents/**\` и \`src/kernel/DEPENDENCY_MAP.md\`.`,
);
md.push(
    'Две генерируемые страницы-самоотчёта (`docs-health`, `docs-inventory`) исключены, чтобы числа не зависели от самих отчётов.',
);
md.push('');
md.push('## По категориям');
md.push('');
md.push('| Категория | Документов |');
md.push('| --- | --- |');
for (const c of Object.keys(byCategory).sort()) md.push(`| ${c} | ${byCategory[c]} |`);
md.push('');
md.push('## По языку');
md.push('');
md.push('| Язык | Документов |');
md.push('| --- | --- |');
for (const l of Object.keys(byLanguage).sort()) md.push(`| ${l} | ${byLanguage[l]} |`);
md.push('');
md.push(`_Основной язык подробной документации — русский (\`ru\`)._`);
md.push('');
md.push(`## Дубликаты содержимого (${duplicateContent.length})`);
md.push('');
if (!duplicateContent.length) md.push('Не найдено.');
else for (const group of duplicateContent.slice(0, 20)) md.push(`- ${group.map((p) => `\`${p}\``).join(' = ')}`);
if (duplicateContent.length > 20) md.push(`- … +${duplicateContent.length - 20} групп`);
md.push('');
md.push(`## Совпадающие заголовки (${duplicateTitles.length})`);
md.push('');
if (!duplicateTitles.length) md.push('Не найдено.');
else for (const d of duplicateTitles.slice(0, 20)) md.push(`- «${d.title}»: ${d.paths.map((p) => `\`${p}\``).join(', ')}`);
if (duplicateTitles.length > 20) md.push(`- … +${duplicateTitles.length - 20} заголовков`);
md.push('');
md.push('## Код-сущности (существующие авто-каталоги)');
md.push('');
md.push('Инвентарь сущностей кода уже ведётся генераторами (не дублируется здесь):');
md.push(`${catalogLinks}.`);
md.push('');
md.push('Связи «панель → маршрут → компонент → тесты» — в [[docs-health]] и [[panels-catalog]].');
md.push('');
md.push('## Как это считается');
md.push('');
md.push('- Категория — по первой папке под `docs/` (`wiki`, `audits`, `history`, `roadmap`, `reference`, `superseded`, `active`, `new`, иначе `top`); всё вне `docs/` — `repo` (README, AGENTS, CHANGELOG, `.superagents`, dependency map).');
md.push('- Язык — доля кириллицы среди букв: `ru` ≥ 0.5, `en` ≤ 0.15, иначе `mixed`.');
md.push('- Дубликаты содержимого — совпадение sha1 нормализованного текста (без пробелов, в нижнем регистре).');
md.push('- Совпадающие заголовки — нормализованный первый `#`-заголовок.');
md.push('- Источник данных: `scripts/gen-docs-inventory.mjs` → `docs/inventory.json` → эта страница.');
md.push('- Дальше: Этап 2 (модель сущности, статусы достоверности, источники истины) и Этап 4 (полная карта систем); см. [[dev-generators]] и [[dev-ci]].');

mkdirSync(resolve(root, 'src/generated'), { recursive: true });
writeFileSync(
    resolve(root, 'src/generated/wiki-docs-inventory.ts'),
    `// Generated by node scripts/gen-docs-inventory.mjs — do not hand-edit.\nexport const DOCS_INVENTORY_MARKDOWN: string = ${JSON.stringify(md.join('\n'))};\n`,
    'utf8',
);
console.log(
    `docs inventory: ${items.length} documents, content dupes ${duplicateContent.length}, title dupes ${duplicateTitles.length}`,
);
