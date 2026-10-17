// Shared parser: nav sections -> items, resolved from the route registries.
// Used by gen-readme-maps.mjs and gen-wiki-panel-catalog.mjs so both agree on
// the same code-truth (core + system + content sections, incl. technique spread).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

/** Flat 'nav.*' label map for a language (ru | en). */
export function navLabels(lang) {
    const src = read(`src/i18n/translations/${lang}/nav.ts`);
    const map = new Map();
    const re = /'(nav\.[^']+)':\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(src))) map.set(m[1], m[2].replace(/\\'/g, "'"));
    return map;
}

/** Technique nav items declared in the technique bundle (spread into a section). */
export function techniqueItems() {
    const src = read('src/components/TechniquePanels/technique-panels-bundle.tsx');
    const items = [];
    const re = /\{\s*id:\s*'([\w-]+)',\s*labelKey:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src))) items.push({ id: m[1], labelKey: m[2] });
    return items;
}

/** Technique panel id -> component path (from the bundle). */
export function techniqueComponents() {
    const src = read('src/components/TechniquePanels/technique-panels-bundle.tsx');
    const map = {};
    const re = /'([\w-]+)':\s*React\.lazy\(\s*\(\)\s*=>\s*import\('\.\/([\w]+)'\)/g;
    let m;
    while ((m = re.exec(src))) map[m[1]] = `src/components/TechniquePanels/${m[2]}`;
    return map;
}

/** Panel nav id -> component path declared in route-imports.ts. */
export function routeImportComponents() {
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

/** Nav sections in order, each with its items ({ id, path?, labelKey, status? }). */
export function parseNavSections() {
    const text =
        read('src/route-registry-core.ts') +
        '\n' +
        read('src/route-registry-system.ts') +
        '\n' +
        read('src/route-registry-content.ts');
    const techItems = techniqueItems();
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
    return sections;
}
