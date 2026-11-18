import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');

function walk(dir) {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else out.push(p);
    }
    return out;
}

function readText(p) {
    return readFileSync(p, 'utf8');
}

function countTsFiles() {
    const files = walk(SRC).filter((p) => /\.tsx?$/.test(p));
    const tests = files.filter((p) => /\.(test|spec)\.tsx?$/.test(p));
    const app = files.filter((p) => !/\.(test|spec)\.tsx?$/.test(p));
    let loc = 0;
    let appLoc = 0;
    for (const p of files) {
        const n = readText(p).split('\n').length;
        loc += n;
        if (!/\.(test|spec)\.tsx?$/.test(p)) appLoc += n;
    }
    return { files: files.length, appFiles: app.length, testFiles: tests.length, loc, appLoc };
}

function countReviewMarkers() {
    const re = /\b(TODO|FIXME|HACK|XXX)\b/i;
    let found = 0;
    for (const p of walk(SRC)) {
        if (!/\.tsx?$/.test(p)) continue;
        for (const line of readText(p).split('\n')) {
            const t = line.trim();
            if (!t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*')) continue;
            if (re.test(t)) found++;
        }
    }
    return found;
}

function countAsAny() {
    let n = 0;
    for (const p of walk(SRC)) {
        if (!/\.tsx?$/.test(p)) continue;
        const m = readText(p).match(/\bas any\b/g);
        if (m) n += m.length;
    }
    return n;
}

function servicesCount() {
    const dir = join(SRC, 'kernel/services');
    if (!existsSync(dir)) return 0;
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
}

function ciJobs() {
    const f = join(root, '.github/workflows/ci.yml');
    if (!existsSync(f)) return 0;
    return (readText(f).match(/^    [a-zA-Z0-9_-]+:\s*$/gm) || []).length;
}

function readJson(name) {
    const p = join(root, 'docs', name);
    if (!existsSync(p)) return null;
    try {
        return JSON.parse(readText(p));
    } catch {
        return null;
    }
}

const ts = countTsFiles();
const inventory = readJson('inventory.json');
const manifest = readJson('manifest.json');
const graph = readJson('graph.json');

const parts = [];
parts.push('<!-- Автосгенерировано `scripts/gen-reality-map.mjs` — не редактировать вручную. -->');
parts.push('');
parts.push('# Карта реальности проекта');
parts.push('');
parts.push(
    `> Раздел: **Разработчикам** · Свежесть: verified · Дата генерации: ${new Date().toISOString().slice(0, 10)}`,
);
parts.push('');
parts.push(
    'Живая сводка состояния проекта из кода, конфигурации и сгенерированных артефактов (`docs/inventory.json`, `docs/manifest.json`, `docs/graph.json`). В отличие от статичных карт `docs/audits/waves/map-*.md`, эта страница пересобирается автоматически и не устаревает.',
);
parts.push('');
parts.push('## Метрики кода');
parts.push('');
parts.push('| Метрика | Значение |');
parts.push('| --- | --- |');
parts.push(
    `| Файлов TS/TSX в \`src/\` | ${ts.files} (приложение: ${ts.appFiles}, тесты: ${ts.testFiles}) |`,
);
parts.push(
    `| Строк кода TS/TSX | ${ts.loc.toLocaleString('ru-RU')} (приложение: ${ts.appLoc.toLocaleString('ru-RU')}) |`,
);
parts.push(`| Сервисов ядра (\`src/kernel/services/\`) | ${servicesCount()} |`);
parts.push(`| TODO/FIXME/HACK/XXX в комментариях | ${countReviewMarkers()} |`);
parts.push(`| \`as any\` в \`src/\` | ${countAsAny()} |`);
const pkg = JSON.parse(readText(join(root, 'package.json')));
parts.push(`| Runtime-зависимостей | ${Object.keys(pkg.dependencies || {}).length} |`);
parts.push(`| Dev-зависимостей | ${Object.keys(pkg.devDependencies || {}).length} |`);
parts.push('');
parts.push('## Документация (сгенерировано)');
parts.push('');
parts.push('| Метрика | Значение |');
parts.push('| --- | --- |');
if (inventory) {
    parts.push(`| Документов в инвентаре | ${inventory.totals?.documents ?? 'n/a'} |`);
}
if (manifest) {
    parts.push(`| Статей вики | ${manifest.articles?.length ?? 'n/a'} |`);
    parts.push(`| Панелей | ${manifest.panels?.length ?? 'n/a'} |`);
}
if (graph) {
    parts.push(`| Узлов графа знаний | ${graph.nodes?.length ?? 'n/a'} |`);
    parts.push(`| Рёбер графа знаний | ${graph.edges?.length ?? 'n/a'} |`);
}
parts.push('');
parts.push('## CI');
parts.push('');
parts.push('| Метрика | Значение |');
parts.push('| --- | --- |');
parts.push(`| Задач в \`.github/workflows/ci.yml\` | ${ciJobs()} |`);
parts.push('| Линт: baseline max-warnings | 4300 |');
parts.push('');
parts.push('## Источники');
parts.push('');
parts.push('- `scripts/gen-reality-map.mjs` → `docs/wiki/dev-reality-map.md`');
parts.push(
    '- Данные: `src/**`, `package.json`, `.github/workflows/ci.yml`, `docs/inventory.json`, `docs/manifest.json`, `docs/graph.json`, `git rev-parse`',
);

writeFileSync(join(root, 'docs/wiki/dev-reality-map.md'), parts.join('\n') + '\n', 'utf8');
console.log(
    `reality map: ts ${ts.files}, review markers ${countReviewMarkers()}, as-any ${countAsAny()}, services ${servicesCount()}`,
);
