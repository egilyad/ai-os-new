// Generator: embeds code-truth maps (debate strategies, quality techniques,
// nav panels) into README_EN.md between markers. Run: node scripts/gen-readme-maps.mjs
// Re-run after adding strategies/techniques/panels — never hand-edit the blocks.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { navLabels, parseNavSections } from './lib/route-nav.mjs';

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
function prettyId(id) {
    return id.split(/[-_]/).map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s)).join(' ');
}

// ---------- nav panels ----------
function sectionsWithLabels(labels) {
    return parseNavSections().map((sec) => ({
        id: sec.id,
        label: labels.get(sec.labelKey) || prettyId(sec.id),
        items: sec.items.map((it) => ({
            id: it.id,
            label: labels.get(it.labelKey) || prettyId(it.id),
        })),
    }));
}

// ---------- markdown builders ----------
const EN_STR = {
    strategies: (n) => `All ${n} built-in debate strategies (from code)`,
    thStrategy: 'Strategy',
    thId: 'ID',
    thWhat: 'What it does',
    techniques: (n) => `All ${n} debate quality techniques (from code)`,
    panels: (n) => `All ${n} statically-wired nav panels by section (from code)`,
    note: [
        `> Technique panels under Debate Techniques are generated at build time`,
        `> by \`node scripts/gen-technique-panels.mjs\` from the quality-technique catalog.`,
    ],
};
const RU_STR = {
    strategies: (n) => `Все ${n} встроенных стратегий дебатов (из кода)`,
    thStrategy: 'Стратегия',
    thId: 'ID',
    thWhat: 'Что делает',
    techniques: (n) => `Все ${n} техник качества дебатов (из кода)`,
    panels: (n) => `Все ${n} панелей по разделам (из кода)`,
    note: [
        `> Имена/описания стратегий и техник берутся из кода (без перевода);`,
        `> панели подписаны русскими локалями \`nav.*\`.`,
    ],
};

function strategiesMd(list, s) {
    const rows = list.map(
        (x) => `| **${escMd(x.name)}** | \`${x.id}\` | ${escMd(x.desc)} |`,
    );
    return [
        `<details>`,
        `<summary><b>${s.strategies(list.length)}</b></summary>`,
        ``,
        `| ${s.thStrategy} | ${s.thId} | ${s.thWhat} |`,
        `| -------- | -- | ----------- |`,
        ...rows,
        ``,
        `</details>`,
    ].join('\n');
}

function techniquesMd(list, s) {
    const byCat = new Map();
    for (const t of list) {
        if (!byCat.has(t.category)) byCat.set(t.category, []);
        byCat.get(t.category).push(t);
    }
    const parts = [
        `<details>`,
        `<summary><b>${s.techniques(list.length)}</b></summary>`,
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

function panelsMd(sections, s) {
    const total = sections.reduce((n, sec) => n + sec.items.length, 0);
    const parts = [
        `<details>`,
        `<summary><b>${s.panels(total)}</b></summary>`,
        ``,
    ];
    for (const sec of sections) {
        parts.push(`**${escMd(sec.label)}** (\`${sec.id}\`, ${sec.items.length})`);
        parts.push(``);
        for (const it of sec.items) {
            parts.push(`- ${escMd(it.label)} (\`${it.id}\`)`);
        }
        parts.push(``);
    }
    parts.push(...s.note, `</details>`);
    return parts.join('\n');
}

// ---------- main ----------
function replaceBlock(readme, key, body) {
    const begin = `<!-- ${key}:BEGIN -->`;
    const end = `<!-- ${key}:END -->`;
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
const enSections = sectionsWithLabels(navLabels('en'));
const ruSections = sectionsWithLabels(navLabels('ru'));

console.log(`strategies: ${strategies.length}, techniques: ${techniques.length}, ` +
    `sections: ${enSections.length}, panels: ${enSections.reduce((n, s) => n + s.items.length, 0)}`);

const date = new Date().toISOString().slice(0, 10);
const enHeader = `_Generated from code on ${date} by \`node scripts/gen-readme-maps.mjs\` — do not hand-edit, re-run the script._\n\n`;
const ruHeader = `_Сгенерировано из кода ${date}, скрипт \`npm run gen:readme-maps\` — не редактировать вручную, перезапускать скрипт._\n\n`;

let readme = readFileSync(resolve(root, 'README_EN.md'), 'utf8');
readme = replaceBlock(readme, 'README-MAPS:STRATEGIES', enHeader + strategiesMd(strategies, EN_STR));
readme = replaceBlock(readme, 'README-MAPS:TECHNIQUES', enHeader + techniquesMd(techniques, EN_STR));
readme = replaceBlock(readme, 'README-MAPS:PANELS', enHeader + panelsMd(enSections, EN_STR));
writeFileSync(resolve(root, 'README_EN.md'), readme);

let readmeRu = readFileSync(resolve(root, 'README.md'), 'utf8');
readmeRu = replaceBlock(readmeRu, 'README-MAPS-RU:STRATEGIES', ruHeader + strategiesMd(strategies, RU_STR));
readmeRu = replaceBlock(readmeRu, 'README-MAPS-RU:TECHNIQUES', ruHeader + techniquesMd(techniques, RU_STR));
readmeRu = replaceBlock(readmeRu, 'README-MAPS-RU:PANELS', ruHeader + panelsMd(ruSections, RU_STR));
writeFileSync(resolve(root, 'README.md'), readmeRu);
console.log('README.md + README_EN.md updated');
