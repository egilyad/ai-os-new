#!/usr/bin/env node
/**
 * gen-audit-prompts-site.mjs
 *
 * Собирает из docs/audits-tips/auditstips.md само-достаточный сайт-энциклопедию
 * промтов для аудитов: docs/audits-tips/index.html (поиск + копирование).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'docs', 'audits-tips');
const SRC = join(SRC_DIR, 'auditstips.md');
const OUT = join(SRC_DIR, 'index.html');
const SLOC = join(ROOT, 'docs', 'wiki', 'auditsinfo', 'auditstips.md.md');

let text = '';
if (existsSync(SRC)) text = readFileSync(SRC, 'utf8');
else if (existsSync(SLOC)) text = readFileSync(SLOC, 'utf8');
else {
  console.error('source not found');
  process.exit(1);
}

const SKIP_LINE = /^\s*\[\^\w+\]:|^\s*<span style="display:none"|^\s*<img|^\s*<div align="center">|^\s*<div align="left">/i;

// structure: cards = [{ title, body }] — одна карточка на раздел H1 (статью/промт)
const cards = [];
let cur = null;

function pushCur() {
  if (cur && cur.body.trim()) cards.push(cur);
}

const lines = text.split('\n');
for (const raw of lines) {
  const line = raw.replace(/\r$/, '');
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    if (h[1].length === 1) {
      pushCur();
      cur = { title: h[2].trim(), body: '' };
    } else if (cur) {
      cur.body += line + '\n';
    }
    continue;
  }
  if (!cur) {
    if (line.trim()) cur = { title: 'Промт', body: '' };
    else continue;
  }
  if (SKIP_LINE.test(line)) continue;
  cur.body += line + '\n';
}
pushCur();

const prompts = cards
  .map((c) => ({ ...c, body: c.body.replace(/\n{3,}/g, '\n\n').trim() }))
  .filter((c) => c.body.length > 40);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const items = prompts
  .map(
    (p, i) => `<article class="card" data-idx="${i}">
  <h3>${esc(p.title)}</h3>
  <pre class="body">${esc(p.body)}</pre>
  <button class="copy" data-idx="${i}">📋 Копировать</button>
</article>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Энциклопедия промтов для аудитов</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:1.5rem 1rem;color:#0f172a;line-height:1.55}
  h1{font-size:1.6rem;margin:0 0 .2rem}
  .sub{color:#64748b;margin-bottom:1.2rem}
  #search{width:100%;padding:.7rem .9rem;font-size:1rem;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:1.2rem}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:.9rem}
  .card{border:1px solid #e2e8f0;border-radius:12px;padding:1rem;background:#f8fafc;display:flex;flex-direction:column;gap:.5rem}
  .card h3{margin:0;font-size:1rem;line-height:1.35}
  .article{font-size:.78rem;color:#64748b}
  pre.body{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem;font-size:.82rem;max-height:260px;overflow:auto;margin:0}
  .copy{align-self:flex-start;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:.45rem .8rem;font-weight:600;cursor:pointer}
  .copy:hover{background:#1d4ed8}
  .hint{font-size:.85rem;color:#94a3b8}
</style>
</head>
<body>
<h1>Энциклопедия промтов для аудитов</h1>
<div class="sub">${prompts.length} промтов · поиск + копирование</div>
<input id="search" type="search" placeholder="Поиск по названию и тексту…">
<div class="hint" id="count"></div>
<div class="cards" id="cards">${items}</div>
<script>
  const data = ${JSON.stringify(prompts.map((p) => ({ t: p.title, b: p.body })))};
  const cardsEl = document.getElementById('cards');
  const searchEl = document.getElementById('search');
  const countEl = document.getElementById('count');
  const cards = Array.from(document.querySelectorAll('.card'));
  function apply(q) {
    q = q.toLowerCase();
    let n = 0;
    cards.forEach((card, i) => {
      const d = data[i];
      const ok = !q || d.t.toLowerCase().includes(q) || d.b.toLowerCase().includes(q);
      card.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    countEl.textContent = n + ' из ' + data.length;
  }
  searchEl.addEventListener('input', () => apply(searchEl.value));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.copy');
    if (!b) return;
    const i = +b.dataset.idx;
    if (navigator.clipboard) navigator.clipboard.writeText(data[i].b);
  });
  apply('');
</script>
</body>
</html>
`;

mkdirSync(SRC_DIR, { recursive: true });
writeFileSync(OUT, html);
if (!existsSync(SRC) && existsSync(SLOC)) copyFileSync(SLOC, SRC);
console.log(`[audit-prompts] ${prompts.length} cards -> docs/audits-tips/index.html`);
