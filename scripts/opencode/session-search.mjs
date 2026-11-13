// session-search.mjs — v0: поиск по индексу сессий (session-index.json).
// Read-only. Используется командой /sessions.
// Примеры:
//   node scripts/opencode/session-search.mjs wiki
//   node scripts/opencode/session-search.mjs --dir "New folder" --open --limit 10
//   node scripts/opencode/session-search.mjs --since 2026-11-01

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = process.env.OC_INDEX || resolve(__dirname, '../../.superagents/memory/session-index.json');

const args = process.argv.slice(2);
const query = [];
let dirFilter = null;
let openOnly = false;
let since = null;
let limit = 15;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dir') dirFilter = args[++i];
  else if (a === '--open') openOnly = true;
  else if (a === '--since') since = args[++i];
  else if (a === '--limit') limit = Number(args[++i]) || 15;
  else query.push(a);
}

let index;
try {
  index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
} catch {
  console.error('Индекс не найден:', INDEX_PATH);
  console.error('Сначала запусти: node scripts/opencode/session-index.mjs');
  process.exit(1);
}

const q = query.join(' ').toLowerCase();
const sinceTs = since ? new Date(since).getTime() : null;

const results = [];
for (const [dir, bucket] of Object.entries(index.byDirectory || {})) {
  if (dirFilter && !dir.toLowerCase().includes(dirFilter.toLowerCase())) continue;
  for (const s of bucket.sessions) {
    if (openOnly && !s.openTodos) continue;
    if (sinceTs && s.createdAt < sinceTs) continue;
    const hay = `${s.title || ''} ${dir}`.toLowerCase();
    if (q && !hay.includes(q)) continue;
    results.push({ dir, ...s });
  }
}

results.sort((a, b) => b.createdAt - a.createdAt);
const shown = results.slice(0, limit);

console.log(`Найдено: ${results.length} сессий (показано ${shown.length})`);
for (const s of shown) {
  console.log('');
  console.log(`  ${new Date(s.createdAt).toISOString().slice(0, 16).replace('T', ' ')} | ${s.version} | ${s.title || 'без названия'}`);
  console.log(`    dir: ${s.dir}`);
  console.log(`    id: ${s.id} | открытых todo: ${s.openTodos}/${s.totalTodos} | добавлено: ${s.additions ?? '?'} / удалено: ${s.deletions ?? '?'} | файлов: ${s.files ?? '?'}`);
}
if (!shown.length) console.log('Ничего не найдено.');
