// stats.mjs — v0: актуальные счётчики проекта для AGENTS.md.
// Read-only. Выводит числа; цифры вручную не поддерживаются.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

function countSource(dir, exts) {
  let n = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) n += countSource(p, exts);
      else if (entry.isFile() && exts.includes(extname(entry.name)) && !entry.name.includes('.test.')) n += 1;
    }
  } catch { /* нет каталога */ }
  return n;
}

const contracts = countSource(join(ROOT, 'src/kernel/contracts'), ['.ts']);
const services = countSource(join(ROOT, 'src/kernel/services'), ['.ts']);
const panels = countSource(join(ROOT, 'src/components'), ['.tsx']);

let events = 0;
try {
  const groups = readdirSync(join(ROOT, 'src/kernel/events/registry-groups'));
  for (const f of groups) {
    if (!f.endsWith('.ts')) continue;
    const txt = readFileSync(join(ROOT, 'src/kernel/events/registry-groups', f), 'utf8');
    events += (txt.match(/^\s{4}[\w]+:\s*event\(/gm) || []).length;
  }
} catch { /* нет каталога */ }

console.log(JSON.stringify({ contracts, services, panels, events }, null, 2));
