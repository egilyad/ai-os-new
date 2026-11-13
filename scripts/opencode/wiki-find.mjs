// wiki-find.mjs — v0: поиск статей и панелей по docs/manifest.json.
// Read-only. Используется командой /wiki.
// Примеры:
//   node scripts/opencode/wiki-find.mjs assistant
//   node scripts/opencode/wiki-find.mjs --section panels --limit 10

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../docs/manifest.json');

const args = process.argv.slice(2);
const query = [];
let section = null;
let limit = 10;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--section') section = args[++i];
  else if (a === '--limit') limit = Number(args[++i]) || 10;
  else query.push(a);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const q = query.join(' ').toLowerCase();

const results = [];
for (const a of manifest.articles || []) {
  if (section && a.section !== section) continue;
  if (!q) { results.push(a); continue; }
  const hay = `${a.title || ''} ${a.slug || ''} ${(a.tags || []).join(' ')} ${a.section || ''}`.toLowerCase();
  if (hay.includes(q)) results.push(a);
}
for (const p of manifest.panels || []) {
  if (section && section !== 'panels') continue;
  if (!q) continue;
  const hay = `${p.title || ''} ${p.slug || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
  if (hay.includes(q)) results.push({ ...p, kind: 'panel' });
}

results.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
const shown = results.slice(0, limit);

console.log(`Найдено: ${results.length} (показано ${shown.length})`);
for (const r of shown) {
  const kind = r.kind === 'panel' ? 'panel' : 'article';
  console.log(`  [${kind}] ${r.title}`);
  if (r.slug) console.log(`    docs/wiki/${r.slug}.md`);
  if (r.tags && r.tags.length) console.log(`    теги: ${r.tags.slice(0, 6).join(', ')}`);
  if (r.path) console.log(`    путь: ${r.path}`);
}
if (!shown.length) console.log('Ничего не найдено.');
