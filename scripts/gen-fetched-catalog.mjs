#!/usr/bin/env node
/**
 * gen-fetched-catalog.mjs
 *
 * Строит каталог статей из docs/fetched-sites/ (скрапленные сайты) по категориям.
 * Читает каждую папку, берёт заголовок из index.md и считает страницы.
 * Пишет: docs/fetched-sites/README.md
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs', 'fetched-sites');
const OUT = join(SRC, 'README.md');
const HTML_OUT = join(SRC, 'index.html');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(sites, byCat) {
  const cats = [...byCat.keys()].sort((a, b) => byCat.get(b).length - byCat.get(a).length);
  const body = cats
    .map((cat) => {
      const list = byCat.get(cat);
      const items = list
        .map(
          (s) =>
            `<li><a href="./${escapeHtml(s.dir)}/index.md">${escapeHtml(s.title)}</a> — ${s.pages} стр. <span class="cat">${escapeHtml(s.category)}</span></li>`,
        )
        .join('\n');
      return `<h2>${escapeHtml(cat)} (${list.length})</h2>\n<ul>\n${items}\n</ul>`;
    })
    .join('\n\n');
  const totalPages = sites.reduce((sum, s) => sum + s.pages + 2, 0);
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Скачанные сайты (fetched-sites)</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#0f172a;line-height:1.55}
  h1{font-size:1.5rem} h2{font-size:1.1rem;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:.3rem;margin-top:1.6rem}
  ul{list-style:none;padding:0} li{padding:.28rem 0;border-bottom:1px dashed #eef2f7}
  a{color:#2563eb;text-decoration:none} a:hover{text-decoration:underline}
  .cat{font-size:.78rem;color:#94a3b8;float:right} .hint{font-size:.85rem;color:#64748b}
</style>
</head>
<body>
<h1>Скачанные сайты (fetched-sites)</h1>
<p class="hint">Всего папок: <b>${sites.length}</b>, страниц: <b>${totalPages}</b>. Каталог генерируется <code>scripts/gen-fetched-catalog.mjs</code>.</p>
${body}
</body>
</html>
`;
}

const CATEGORY_RULES = [
  { re: /сайт-без-названия/i, cat: 'Без названия (прочее)' },
  { re: /агент|agent|multiagent|orchestr|оркестр|ai-|ии|и и/i, cat: 'ИИ и агенты' },
  { re: /debate|дебат|спор/i, cat: 'Дебаты' },
  { re: /research|исслед/i, cat: 'Исследования' },
  { re: /code|codex|repo|starter|kit|программ|код|проект/i, cat: 'Код и проекты' },
  { re: /book|книг|статья|gide|гайд|документац|doc/i, cat: 'Документация и гайды' },
];
const DEFAULT_CAT = 'Прочее';

function categoryOf(name) {
  for (const r of CATEGORY_RULES) {
    if (r.re.test(name)) return r.cat;
  }
  return DEFAULT_CAT;
}

const GENERIC_HEADING = /главная|index|untitled|сайт[-\s]*без[-\s]*названия|без[-\s]*названия/i;
const GENERIC_TITLE = /сайт-без-названия|без\s*названия/i;

function isMeaningfulHeading(h) {
  if (!h) return false;
  if (h.length < 3) return false;
  if (GENERIC_HEADING.test(h)) return false;
  return true;
}

function headingOf(file) {
  try {
    const s = readFileSync(file, 'utf8').slice(0, 60000);
    for (const line of s.split('\n')) {
      const m = line.match(/^#\s+(.+)$/);
      if (m && isMeaningfulHeading(m[1].trim())) return m[1].trim();
    }
    const t = s.match(/<title>([^<]+)<\/title>/i);
    if (t && isMeaningfulHeading(t[1].trim())) return t[1].trim();
  } catch {
    /* skip */
  }
  return '';
}

function titleOf(dir) {
  const idx = join(SRC, dir, 'index.md');
  const h = headingOf(idx);
  if (h) return h;
  // Generic/empty index — scan pages for the most meaningful heading.
  let best = '';
  let files = [];
  try {
    files = readdirSync(join(SRC, dir)).filter((f) => f.endsWith('.md'));
  } catch {
    files = [];
  }
  for (const f of files.slice(0, 20)) {
    const hh = headingOf(join(SRC, dir, f));
    if (hh && hh.length > best.length) best = hh;
  }
  if (best) return best;
  const base = dir.replace(/-\w{8,10}$/i, '').replace(/[-_]/g, ' ').trim();
  return base && !GENERIC_TITLE.test(base) ? base : 'Без названия';
}

function pagesOf(dir) {
  try {
    const files = readdirSync(join(SRC, dir));
    return files.filter((f) => f.endsWith('.md') && f !== 'index.md' && f !== '_home.md').length;
  } catch {
    return 0;
  }
}

const dirs = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory());

const sites = dirs.map((d) => {
  const title = titleOf(d);
  return { dir: d, title, category: categoryOf(title + ' ' + d), pages: pagesOf(d) };
});
sites.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

const byCat = new Map();
for (const s of sites) {
  const list = byCat.get(s.category) ?? [];
  list.push(s);
  byCat.set(s.category, list);
}

const totalPages = sites.reduce((sum, s) => sum + s.pages + 2, 0); // + index + _home at most
const lines = [
  '<!-- Каталог скачанных сайтов: автосгенерировано scripts/gen-fetched-catalog.mjs. -->',
  '',
  '# Скачанные сайты (fetched-sites)',
  '',
  `> Всего папок: **${sites.length}**, страниц: **${totalPages}**.`,
  '',
  'Каждая папка — снимок одного сайта: `index.md` (главная) + страницы `p_*` / `_home.md`.',
  '',
  `## Категории`,
  '',
];
const cats = [...byCat.keys()].sort((a, b) => byCat.get(b).length - byCat.get(a).length);
for (const cat of cats) {
  const list = byCat.get(cat);
  lines.push(`### ${cat} (${list.length})`, '');
  for (const s of list) {
    lines.push(`- **${s.title}** — ${s.pages} стр. · категория: ${s.category} → [index](${s.dir}/index.md)`);
  }
  lines.push('');
}
lines.push('', '---', '', 'Сгенерировано `scripts/gen-fetched-catalog.mjs`.');
writeFileSync(OUT, lines.join('\n') + '\n');
writeFileSync(HTML_OUT, renderHtml(sites, byCat));
console.log(`[fetched-catalog] ${sites.length} sites, ${byCat.size} categories -> docs/fetched-sites/README.md + index.html`);
