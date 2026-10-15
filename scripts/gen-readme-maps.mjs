// Generator: embeds code-truth maps (debate strategies, quality techniques,
// nav panels) into README.md between markers. Run: node scripts/gen-readme-maps.mjs
// Re-run after adding strategies/techniques/panels — never hand-edit the blocks.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

function parseQuoted(s, qIndex) {
    const q = s[qIndex];
    let i = qIndex + 1;
    let out = '';
    while (i < s.length) {
        const c = s[i];
        if (c === '\\') { out += s[i + 1]; i += 2; continue; }
        if (c === q) break;
        out += c; i++;
    }
    return { value: out, end: i + 1 };
}

function grab(s, key, from) {
    const idx = s.indexOf(key, from);
    if (idx === -1) return { value: '', end: from };
    return parseQuoted(s, idx + key.length - 1);
}

function oneLine(s) {
    return s.replace(/\s+/g, ' ').trim();
}

function escMd(s) {
    return s.replace(/\|/g, '\\|');
}

// ---------- debate strategies ----------
function parseStrategies() {
    const src = readFileSync(
        resolve(root, 'src/kernel/services/debate-runtime/debate-strategy-definitions.ts'),
        'utf8',
    );
    const out = [];
    let pos = 0;
    const marker = "id: 'builtin.";
    while ((pos = src.indexOf(marker, pos)) !== -1) {
        const id = parseQuoted(src, pos + 'id: '.length).value;
        const afterId = pos + marker.length;
        const name = grab(src, "name: '", afterId).value;
        // Description may span lines — capture up to the version field.
        const descIdx = src.indexOf('description:', afterId);
        const verIdx = src.indexOf('version:', descIdx);
        let desc = '';
        if (descIdx !== -1 && verIdx !== -1) {
            desc = oneLine(src.slice(descIdx + 'description:'.length, verIdx))
                .replace(/^['"`\s]+|['"`,;\s]+$/g, '').trim();
        }
        out.push({ id, name, desc });
        pos = verIdx === -1 ? afterId + 1 : verIdx;
    }
    return out;
}

// ---------- quality techniques ----------
function parseTechniques() {
    const src = readFileSync(
        resolve(root, 'src/kernel/contracts/debate-quality-settings.ts'),
        'utf8',
    );
    const out = [];
    let pos = 0;
    const marker = "id: '";
    while ((pos = src.indexOf(marker, pos)) !== -1) {
        const idRes = parseQuoted(src, pos + marker.length - 1);
        const nameRes = grab(src, "name: '", idRes.end);
        if (!idRes.value || !nameRes.value) { pos = idRes.end; continue; }
        const descRes = grab(src, "description: '", nameRes.end);
        const catRes = grab(src, "category: '", descRes.end);
        out.push({
            id: idRes.value,
            name: nameRes.value,
            desc: oneLine(descRes.value).slice(0, 160),
            category: catRes.value || 'general',
        });
        pos = catRes.end;
    }
    return out;
}

// ---------- i18n labels ----------
function parseNavLabels() {
    const src = readFileSync(
        resolve(root, 'src/i18n/translations/en/nav.ts'),
        'utf8',
    );
    const map = new Map();
    const re = /'(nav\.[^']+)':\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(src))) map.set(m[1], m[2]);
    return map;
}

function prettyId(id) {
    return id.split(/[-_]/).map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s)).join(' ');
}

// ---------- nav panels ----------
function parseSections(file, labels) {
    const src = readFileSync(resolve(root, file), 'utf8');
    const sections = [];
    // Section headers: id: 'section-...', labelKey: '...'
    const secRe = /id:\s*'(section-[^']+)'\s*,?\s*\n?\s*labelKey:\s*'([^']+)'/g;
    let m;
    const bounds = [];
    while ((m = secRe.exec(src))) {
        bounds.push({ id: m[1], labelKey: m[2], index: m.index });
    }
    // Items: id: '...', labelKey: '...' (spreads have no id — skipped automatically)
    const itemRe = /id:\s*'([^']+)'\s*,?\s*\n?\s*labelKey:\s*'([^']+)'/g;
    const items = [];
    while ((m = itemRe.exec(src))) {
        if (m[1].startsWith('section-')) continue;
        items.push({ id: m[1], labelKey: m[2], index: m.index });
    }
    for (let i = 0; i < bounds.length; i++) {
        const start = bounds[i].index;
        const end = i + 1 < bounds.length ? bounds[i + 1].index : src.length;
        const own = items.filter((it) => it.index > start && it.index < end);
        sections.push({
            id: bounds[i].id,
            label: labels.get(bounds[i].labelKey) || prettyId(bounds[i].id),
            items: own.map((it) => ({
                id: it.id,
                label: labels.get(it.labelKey) || prettyId(it.id),
            })),
        });
    }
    return sections;
}

// ---------- markdown builders ----------
function strategiesMd(list) {
    const rows = list.map(
        (s) => `| **${escMd(s.name)}** | \`${s.id}\` | ${escMd(s.desc)} |`,
    );
    return [
        `<details>`,
        `<summary><b>All ${list.length} built-in debate strategies (from code)</b></summary>`,
        ``,
        `| Strategy | ID | What it does |`,
        `| -------- | -- | ----------- |`,
        ...rows,
        ``,
        `</details>`,
    ].join('\n');
}

function techniquesMd(list) {
    const byCat = new Map();
    for (const t of list) {
        if (!byCat.has(t.category)) byCat.set(t.category, []);
        byCat.get(t.category).push(t);
    }
    const parts = [
        `<details>`,
        `<summary><b>All ${list.length} debate quality techniques (from code)</b></summary>`,
        ``,
    ];
    for (const [cat, items] of [...byCat.entries()].sort()) {
        parts.push(`**${escMd(cat)}** (${items.length})`);
        parts.push(``);
        for (const t of items) {
            parts.push(`- **${escMd(t.name)}** (\`${t.id}\`) — ${escMd(t.desc)}`);
        }
        parts.push(``);
    }
    parts.push(`</details>`);
    return parts.join('\n');
}

function panelsMd(sections) {
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    const parts = [
        `<details>`,
        `<summary><b>All ${total} statically-wired nav panels by section (from code)</b></summary>`,
        ``,
    ];
    for (const s of sections) {
        parts.push(`**${escMd(s.label)}** (\`${s.id}\`, ${s.items.length})`);
        parts.push(``);
        for (const it of s.items) {
            parts.push(`- ${escMd(it.label)} (\`${it.id}\`)`);
        }
        parts.push(``);
    }
    parts.push(
        `> Technique panels under Debate Techniques are generated at build time`,
        `> by \`node scripts/gen-technique-panels.mjs\` from the quality-technique catalog.`,
        `</details>`,
    );
    return parts.join('\n');
}

// ---------- main ----------
function replaceBlock(readme, name, body) {
    const begin = `<!-- README-MAPS:${name}:BEGIN -->`;
    const end = `<!-- README-MAPS:${name}:END -->`;
    const block = `${begin}\n${body}\n${end}`;
    if (readme.includes(begin) && readme.includes(end)) {
        return readme.replace(
            new RegExp(`${begin}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
            () => block,
        );
    }
    return readme;
}

const strategies = parseStrategies();
const techniques = parseTechniques();
const labels = parseNavLabels();
const sections = [
    ...parseSections('src/route-registry-core.ts', labels),
    ...parseSections('src/route-registry-content.ts', labels),
];

console.log(`strategies: ${strategies.length}, techniques: ${techniques.length}, ` +
    `sections: ${sections.length}, panels: ${sections.reduce((n, s) => n + s.items.length, 0)}`);

const date = new Date().toISOString().slice(0, 10);
const header = `_Generated from code on ${date} by \`node scripts/gen-readme-maps.mjs\` — do not hand-edit, re-run the script._\n\n`;

let readme = readFileSync(resolve(root, 'README.md'), 'utf8');
readme = replaceBlock(readme, 'STRATEGIES', header + strategiesMd(strategies));
readme = replaceBlock(readme, 'TECHNIQUES', header + techniquesMd(techniques));
readme = replaceBlock(readme, 'PANELS', header + panelsMd(sections));
writeFileSync(resolve(root, 'README.md'), readme);
console.log('README.md updated');
