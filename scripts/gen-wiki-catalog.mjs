// Generator: component catalog for the wiki — every panel component with the
// kernel layers it connects to (services / contracts / stores / llm / i18n).
// Run: node scripts/gen-wiki-catalog.mjs  (output is generated, do not hand-edit).
// Reads: src/generated/wiki-panel-map.ts (route id -> component path), src/components/**.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, relative } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = resolve(root, 'src/generated/wiki-component-catalog.ts');

function readPanelMap() {
    const src = readFileSync(resolve(root, 'src/generated/wiki-panel-map.ts'), 'utf8');
    const l = src.indexOf('{');
    const r = src.lastIndexOf('}');
    return JSON.parse(src.slice(l, r + 1));
}

function walk(dir, acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = resolve(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('__')) continue;
            walk(p, acc);
        } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') && !entry.name.endsWith('.spec.tsx')) {
            acc.push(p);
        }
    }
    return acc;
}

const importRe = /import\s+(?:type\s+)?(?:\{([^}]*)\}|(\w+))?\s*from\s*['"]([^'"]+)['"]/g;

function analyze(text) {
    const services = new Set();
    const stores = new Set();
    const contracts = new Set();
    let usesI18n = false;
    let usesLlm = false;
    let m;
    importRe.lastIndex = 0;
    while ((m = importRe.exec(text)) !== null) {
        const named = m[1];
        const spec = m[3] || '';
        const norm = spec.replace(/\\/g, '/');
        if (norm.includes('kernel/instances')) {
            for (const raw of (named || '').split(',')) {
                const name = raw.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0].trim();
                if (name) services.add(name);
            }
        } else if (norm.includes('kernel/contracts')) {
            for (const raw of (named || '').split(',')) {
                const name = raw.replace(/^\s*type\s+/, '').trim();
                if (name) contracts.add(name);
            }
        } else if (/(^|\/)stores(\/|$)/.test(norm)) {
            for (const raw of (named || '').split(',')) {
                const name = raw.replace(/^\s*type\s+/, '').trim();
                if (name) stores.add(name);
            }
        } else if (norm.includes('/llm/')) {
            usesLlm = true;
        }
        if (norm.includes('/i18n/') || norm.includes('useTranslation')) usesI18n = true;
    }
    return { services, stores, contracts, usesI18n, usesLlm };
}

const panelMap = readPanelMap();
const pathToIds = new Map();
for (const [id, p] of Object.entries(panelMap)) {
    const key = p.replace(/\\/g, '/');
    if (!pathToIds.has(key)) pathToIds.set(key, []);
    pathToIds.get(key).push(id);
}

const files = walk(resolve(root, 'src/components'));
const rows = [];
for (const abs of files) {
    const norm = relative(resolve(root, 'src'), abs).replace(/\\/g, '/').replace(/\.tsx$/, '');
    // map key is without extension; directory-index panels map to the dir path
    let ids = pathToIds.get(norm) || [];
    if (ids.length === 0 && /\/index$/.test(norm)) ids = pathToIds.get(norm.replace(/\/index$/, '')) || [];
    const rel = relative(resolve(root, 'src/components'), abs).replace(/\\/g, '/');
    const segs = rel.split('/');
    const folder = segs.length > 1 ? segs[0] : '(корень)';
    const name = segs[segs.length - 1].replace(/\.tsx$/, '');
    const text = readFileSync(abs, 'utf8');
    const a = analyze(text);
    rows.push({ folder, name, file: rel, ids, ...a });
}

rows.sort((x, y) => x.folder.localeCompare(y.folder) || x.name.localeCompare(y.name));

const folders = [...new Set(rows.map((r) => r.folder))];
const asks = (arr) => (arr.length ? [...arr].sort().join(', ') : '—');

const lines = [];
lines.push('## Каталог компонентов');
lines.push('');
lines.push(
    `Сгенерировано автоматически (scripts/gen-wiki-catalog.mjs) из живого дерева src/components/: ${rows.length} компонентов, ${folders.length} групп. Связи — это импорты из слоёв ядра: сервисы (kernel/instances), контракты (kernel/contracts), сторы (src/stores), адаптеры (src/llm), локализация (i18n).`,
);
lines.push('');
lines.push('```mermaid');
lines.push('flowchart LR');
lines.push(`    C["${rows.length} компонентов"] --> I["kernel/instances — сервисы"]`);
lines.push('    C --> K["kernel/contracts — контракты"]');
lines.push('    C --> S["src/stores — состояние"]');
lines.push('    C --> L["src/llm — адаптеры (редко, через сервисы)"]');
lines.push('    C --> T["i18n — переводы"]');
lines.push('```');
lines.push('');
lines.push('### Сводка по группам');
lines.push('');
lines.push('| Группа | Компонентов | С i18n | Сервисов (уник.) |');
lines.push('|---|---|---|---|');
for (const f of folders) {
    const group = rows.filter((r) => r.folder === f);
    const svc = new Set();
    let i18n = 0;
    for (const r of group) {
        r.services.forEach((x) => svc.add(x));
        if (r.usesI18n) i18n++;
    }
    lines.push(`| ${f} | ${group.length} | ${i18n} | ${svc.size} |`);
}
lines.push('');

for (const f of folders) {
    const group = rows.filter((r) => r.folder === f);
    lines.push(`### ${f} (${group.length})`);
    lines.push('');
    lines.push('| Компонент | route id | Файл | Сервисы ядра | Сторы | i18n |');
    lines.push('|---|---|---|---|---|---|');
    for (const r of group) {
        const id = r.ids.length ? r.ids.join(', ') : '—';
        lines.push(
            `| ${r.name} | ${id} | src/components/${r.file} | ${asks(r.services)} | ${asks(r.stores)} | ${r.usesI18n ? 'да' : '—'} |`,
        );
    }
    lines.push('');
}

const md = lines.join('\n');
const out = `// Generated by node scripts/gen-wiki-catalog.mjs — do not hand-edit.
export const CATALOG_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};
export const CATALOG_COMPONENT_COUNT = ${rows.length};
export const CATALOG_MARKDOWN: string = ${JSON.stringify(md)};
`;
writeFileSync(outFile, out, 'utf8');
console.log(`components: ${rows.length}, folders: ${folders.length}, markdown: ${md.length} chars`);
