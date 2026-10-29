#!/usr/bin/env node
/**
 * gen-audit-prompts-site.mjs
 *
 * Собирает из docs/audits-tips/auditstips.md простой каталог промтов для
 * аудитов: categories + поиск + мультивыбор и копирование. Само-достаточный
 * index.html (без внешних зависимостей).
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

const cards = [];
let cur = null;
function pushCur() {
  if (cur && cur.body.trim()) cards.push(cur);
}
for (const raw of text.split('\n')) {
  const line = raw.replace(/\r$/, '');
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    if (h[1].length === 1) {
      pushCur();
      cur = { title: h[2].trim(), body: '' };
    } else if (cur) cur.body += line + '\n';
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

const CAT_RULES = [
  { re: /агент|agent|multiagent|оркестр|флот|совет|роль/i, cat: 'Агенты и оркестрация' },
  { re: /безопасн|секрет|ключ|vault|secret|шифр|уязвим|security/i, cat: 'Безопасность' },
  { re: /дебат|debate|дискусси|обсужд|консенсус|судья/i, cat: 'Дебаты и качество' },
  { re: /память|memory|запомина|консолидац|эпизод|факт/i, cat: 'Память' },
  { re: /производит|скорость|перф|оптимиз|latency|задержк/i, cat: 'Производительность' },
  { re: /баг|bug|ошибк|error|исключен|вылета|краш|crash|сбой/i, cat: 'Баги и ошибки' },
  { re: /код|code|литер|lint|рефактор|тест|test|регресс/i, cat: 'Код и тесты' },
  { re: /ui|ux|интерфейс|панель|интерфейс|кнопк|форм/i, cat: 'UI/UX' },
  { re: /методолог|процесс|аудит|проверк|инвентар|ревизи|чеклист|промт|подход/i, cat: 'Методология аудита' },
];
function categoryOf(title, body) {
  const s = title + ' ' + body.slice(0, 1200);
  for (const r of CAT_RULES) if (r.re.test(s)) return r.cat;
  return 'Прочее';
}

const prompts = cards
  .map((c) => ({
    title: c.title,
    cat: categoryOf(c.title, c.body),
    body: c.body.replace(/\n{3,}/g, '\n\n').trim(),
  }))
  .filter((c) => c.body.length > 40);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const cats = [...new Set(prompts.map((p) => p.cat))].sort();
const items = prompts
  .map(
    (p, i) => `<article class="card" data-idx="${i}" data-cat="${esc(p.cat)}">
  <label class="pick"><input type="checkbox" class="sel" data-idx="${i}"> выбрать</label>
  <h3>${esc(p.title)}</h3>
  <span class="badge">${esc(p.cat)}</span>
  <details><summary>Показать текст</summary><pre class="body">${esc(p.body)}</pre></details>
  <button class="copy" data-idx="${i}">📋 Копировать</button>
</article>`,
  )
  .join('\n');

const chip = cats.map((c) => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join('\n');

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Каталог промтов для аудитов</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;max-width:1180px;margin:0 auto;padding:1.4rem 1rem;color:#0f172a;line-height:1.5}
  h1{font-size:1.5rem;margin:0 0 .2rem}
  .sub{color:#64748b;margin-bottom:1rem}
  .topbar{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem}
  #search{flex:1;min-width:220px;padding:.65rem .9rem;font-size:1rem;border:1px solid #cbd5e1;border-radius:10px}
  .chip{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:999px;padding:.4rem .9rem;cursor:pointer;font-size:.85rem}
  .chip.active{background:#4f46e5;color:#fff;border-color:#4f46e5}
  .btn{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:.6rem 1rem;font-weight:600;cursor:pointer}
  .btn:hover{background:#1d4ed8}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:.9rem}
  .card{border:1px solid #e2e8f0;border-radius:12px;padding:1rem;background:#f8fafc;display:flex;flex-direction:column;gap:.45rem}
  .card h3{margin:0;font-size:1rem;line-height:1.35}
  .badge{align-self:flex-start;font-size:.72rem;background:#e2e8f0;color:#475569;border-radius:999px;padding:.15rem .6rem}
  pre.body{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem;font-size:.82rem;max-height:300px;overflow:auto;margin:.2rem 0}
  summary{cursor:pointer;color:#2563eb;font-size:.85rem}
  .actions{align-self:flex-end;display:flex;gap:.5rem;margin-top:.2rem}
  .copy,.pickbtn{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:8px;padding:.4rem .7rem;cursor:pointer;font-size:.82rem}
  .pick{display:flex;align-items:center;gap:.35rem;font-size:.82rem;color:#475569;cursor:pointer}
  .hidden{display:none!important}
</style>
</head>
<body>
<h1>Каталог промтов для аудитов</h1>
<div class="sub" id="count"></div>
<div class="topbar">
  <input id="search" type="search" placeholder="Поиск по названию или тексту…">
  <button class="btn" id="copySel">Копировать выбранные</button>
</div>
<div class="topbar" id="chips">
  <button class="chip active" data-cat="">Все</button>
  ${chip}
</div>
<div class="cards" id="cards">${items}</div>
<script>
  const data = ${JSON.stringify(prompts.map((p) => ({ t: p.title, c: p.cat, b: p.body })))};
  const cards = Array.from(document.querySelectorAll('.card'));
  const countEl = document.getElementById('count');
  const searchEl = document.getElementById('search');
  const chipEls = Array.from(document.querySelectorAll('.chip'));
  let cat = '';
  let q = '';
  function apply() {
    q = q.toLowerCase();
    let n = 0;
    cards.forEach((card, i) => {
      const d = data[i];
      const okCat = !cat || d.c === cat;
      const okQ = !q || d.t.toLowerCase().includes(q) || d.b.toLowerCase().includes(q);
      const ok = okCat && okQ;
      card.classList.toggle('hidden', !ok);
      if (ok) n++;
    });
    countEl.textContent = n + ' из ' + data.length;
  }
  searchEl.addEventListener('input', (e) => { q = e.target.value; apply(); });
  chipEls.forEach((ch) => ch.addEventListener('click', () => {
    cat = ch.dataset.cat;
    chipEls.forEach((x) => x.classList.toggle('active', x === ch));
    apply();
  }));
  document.addEventListener('click', (e) => {
    const cp = e.target.closest('.copy');
    if (cp) { const i = +cp.dataset.idx; if (navigator.clipboard) navigator.clipboard.writeText(data[i].b); return; }
    const sb = e.target.closest('#copySel');
    if (sb) {
      const sel = Array.from(document.querySelectorAll('.sel:checked')).map((x) => +x.dataset.idx);
      const txt = sel.map((i) => '## ' + data[i].t + '\n\n' + data[i].b).join('\n\n---\n\n');
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt);
    }
  });
  apply();
</script>
</body>
</html>
`;

mkdirSync(SRC_DIR, { recursive: true });
writeFileSync(OUT, html);
if (!existsSync(SRC) && existsSync(SLOC)) copyFileSync(SLOC, SRC);
console.log(`[audit-prompts] ${prompts.length} cards, ${cats.length} categories -> docs/audits-tips/index.html`);
