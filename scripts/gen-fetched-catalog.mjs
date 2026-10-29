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

function titleOf(dir) {
  const idx = join(SRC, dir, 'index.md');
  try {
    const head = readFileSync(idx, 'utf8').slice(0, 3000);
    const m = head.match(/^#\s+(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    /* no index */
  }
  return dir.replace(/-\w{8,10}/i, '').replace(/[-_]/g, ' ').trim() || dir;
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
    lines.push(`- **${s.title}** — ${s.pages} стр. → [index](${s.dir}/index.md)`);
  }
  lines.push('');
}
lines.push('', '---', '', 'Сгенерировано `scripts/gen-fetched-catalog.mjs`.');
writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`[fetched-catalog] ${sites.length} sites, ${byCat.size} categories -> docs/fetched-sites/README.md`);
