// project-state.mjs — v0: снимок состояния проекта (git + последняя контрольная точка).
// Read-only. Используется командой /status.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SESSIONS_DIR = resolve(ROOT, 'docs/sessions');

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.trim() : '';
}

console.log(`# Состояние SuperAgents OS — ${new Date().toISOString().slice(0, 10)}`);
console.log(`Ветка: ${git(['branch', '--show-current']) || '(no branch)'} @ ${git(['rev-parse', '--short', 'HEAD'])}`);
console.log('');
console.log('## HEAD±5');
for (const l of git(['log', '--oneline', '-6']).split('\n').filter(Boolean)) console.log('  ' + l);
console.log('');
const porcelain = git(['status', '--porcelain']).split('\n').filter(Boolean);
console.log(`## Рабочее дерево (${porcelain.length} изменений)`);
for (const l of porcelain.slice(0, 20)) console.log('  ' + l);
if (porcelain.length > 20) console.log(`  ... и ещё ${porcelain.length - 20}`);
console.log('');
const stash = git(['stash', 'list']).split('\n').filter(Boolean);
console.log(`## Stash (${stash.length})`);
for (const l of stash.slice(0, 5)) console.log('  ' + l);
console.log('');
const unpushed = git(['log', '--oneline', '@{u}..HEAD']);
console.log(`## Не запушено (${unpushed ? unpushed.split('\n').length : 0})`);
for (const l of (unpushed || '').split('\n').filter(Boolean).slice(0, 5)) console.log('  ' + l);
console.log('');
let last = null;
try {
  const files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length) {
    last = files.map((f) => ({ f, t: statSync(join(SESSIONS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
  }
} catch { /* нет каталога */ }
if (last) {
  console.log('## Последняя контрольная точка');
  console.log('  docs/sessions/' + last.f);
  console.log(readFileSync(join(SESSIONS_DIR, last.f), 'utf8').split('\n').slice(0, 15).join('\n'));
} else {
  console.log('## Контрольные точки: нет (создай через /checkpoint)');
}
