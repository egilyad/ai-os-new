// Generator: panel catalog — panel -> section -> route -> component -> wiki article.
// Run: node scripts/gen-wiki-panel-catalog.mjs
// Output: src/generated/wiki-panel-catalog.ts (do not hand-edit).
// Sources (parsed as text, no React/tsx pulled in):
//   src/route-registry-{core,system,content}.ts — sections/items
//   src/components/TechniquePanels/technique-panels-bundle.tsx — technique items
//   src/route-imports.ts — panel id -> component path
//   src/i18n/translations/{ru,en}/nav.ts — human labels
//   src/components/WikiPanel/wiki-panels.ts — panel id -> wiki article slug
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const genDir = resolve(root, 'src/generated');
mkdirSync(genDir, { recursive: true });

const read = (p) => readFileSync(resolve(root, p), 'utf8');

// ---- i18n labels (flat 'nav.*' keys) ----
function navLabels(lang) {
    const src = read(`src/i18n/translations/${lang}/nav.ts`);
    const map = {};
    const re = /'((?:nav)\.[^']+)':\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(src))) map[m[1]] = m[2].replace(/\\'/g, "'");
    return map;
}
const ru = navLabels('ru');
const en = navLabels('en');
const label = (key) => ru[key] || en[key] || (key ? key.split('.').pop() : '');

// ---- panel id -> component path (route-imports.ts) ----
function panelComponents() {
    const src = read('src/route-imports.ts');
    const decls = {};
    const declRe = /const\s+(\w+)\s*=\s*React\.lazy\(\s*\(\)\s*=>\s*import\('([^']+)'\)/g;
    let m;
    while ((m = declRe.exec(src))) decls[m[1]] = m[2];
    const map = {};
    const mapRe = /^\s*'?([\w-]+)'?:\s*(\w+),?\s*$/gm;
    while ((m = mapRe.exec(src))) {
        if (decls[m[2]]) map[m[1]] = decls[m[2]].replace(/^\.\//, 'src/');
    }
    return map;
}

// ---- technique id -> component path (bundle) ----
function techniqueData() {
    const src = read('src/components/TechniquePanels/technique-panels-bundle.tsx');
    const comps = {};
    const compRe = /'([\w-]+)':\s*React\.lazy\(\s*\(\)\s*=>\s*import\('\.\/([\w]+)'\)/g;
    let m;
    while ((m = compRe.exec(src))) comps[m[1]] = `src/components/TechniquePanels/${m[2]}`;
    const items = [];
    const itemRe = /\{\s*id:\s*'([\w-]+)',\s*labelKey:\s*'([^']+)'/g;
    while ((m = itemRe.exec(src))) items.push({ id: m[1], labelKey: m[2] });
    return { comps, items };
}

// ---- registry files -> sections ----
function parseSections() {
    const text =
        read('src/route-registry-core.ts') +
        '\n' +
        read('src/route-registry-system.ts') +
        '\n' +
        read('src/route-registry-content.ts');
    const { comps: techComps, items: techItems } = techniqueData();
    const headers = [...text.matchAll(/id:\s*'section-([\w-]+)'/g)];
    const sections = [];
    for (let i = 0; i < headers.length; i++) {
        const chunk = text.slice(headers[i].index, headers[i + 1] ? headers[i + 1].index : text.length);
        const labelKey = /labelKey:\s*'([^']+)'/.exec(chunk)?.[1] ?? '';
        const itemsAt = chunk.indexOf('items:');
        const region = itemsAt >= 0 ? chunk.slice(itemsAt) : '';
        const items = [];
        for (const obj of region.match(/\{[^{}]*\}/g) ?? []) {
            const id = /\bid:\s*'([\w-]+)'/.exec(obj)?.[1];
            if (!id) continue;
            items.push({
                id,
                path: /\bpath:\s*'([^']+)'/.exec(obj)?.[1],
                labelKey: /\blabelKey:\s*'([^']+)'/.exec(obj)?.[1],
                status: /\bstatus:\s*'([\w-]+)'/.exec(obj)?.[1],
            });
        }
        if (/\.\.\.TECHNIQUE_NAV_ITEMS/.test(region)) {
            for (const t of techItems) items.push({ id: t.id, labelKey: t.labelKey });
        }
        sections.push({ id: headers[i][1], labelKey, items });
    }
    // technique components are addressed by their own ids
    for (const [id, path] of Object.entries(techComps)) techComps[id] = path;
    return { sections, techComps };
}

// ---- panel id -> wiki article slug ----
function panelArticles() {
    const src = read('src/components/WikiPanel/wiki-panels.ts');
    const map = {};
    const re = /^\s*'?([\w-]+)'?:\s*'([\w-]+)',?\s*$/gm;
    let m;
    while ((m = re.exec(src))) map[m[1]] = m[2];
    return map;
}

const { sections, techComps } = parseSections();
const panelComp = { ...panelComponents(), ...techComps };
const articles = panelArticles();

const esc = (s) => String(s).replace(/\|/g, '\\|');
const rows = [];
let withArticle = 0;
let withComponent = 0;
let total = 0;
const seen = new Set();
for (const section of sections) {
    for (const item of section.items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        total++;
        const route = item.path ?? `/${item.id}`;
        const comp = panelComp[item.id];
        const slug = articles[item.id];
        if (comp) withComponent++;
        if (slug) withArticle++;
        const status = item.status && item.status !== 'live' ? ` (${item.status})` : '';
        rows.push(
            `| ${esc(label(section.labelKey))} | ${esc(label(item.labelKey))}${status} \`${item.id}\` | \`${route}\` | ${
                comp ? `\`${comp}\`` : '—'
            } | ${slug ? `[[${slug}]]` : '—'} |`,
        );
    }
}

const md = [
    '# Каталог панелей: раздел → маршрут → компонент → статья',
    '',
    '> Автосгенерировано `scripts/gen-wiki-panel-catalog.mjs` из реестра маршрутов,',
    '> `route-imports.ts`, локалей `nav.*` и карты статей вики. Не редактировать вручную.',
    '',
    `Панелей: **${total}** · с компонентом: **${withComponent}** · со статьёй: **${withArticle}** · всего разделов: **${sections.length}**.`,
    '',
    '| Раздел | Панель | Маршрут | Компонент | Статья |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
].join('\n');

writeFileSync(
    resolve(genDir, 'wiki-panel-catalog.ts'),
    `// Generated by node scripts/gen-wiki-panel-catalog.mjs — do not hand-edit.\nexport const PANEL_CATALOG_MARKDOWN: string = ${JSON.stringify(md)};\n`,
);
console.log(`panels: ${total}, with component: ${withComponent}, with article: ${withArticle}, sections: ${sections.length}`);
