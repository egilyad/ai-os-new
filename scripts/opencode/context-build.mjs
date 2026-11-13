// context-build.mjs — v0: сборка компактного контекста (≤150 строк) для старта сессии.
// Источники: git (read-only), session-index.json, последняя контрольная точка docs/sessions/,
// wiki-подсказки из docs/manifest.json. Файл .superagents/memory/context.md НЕ является
// полной историей — только выжимка со ссылками. Авто-генерируется, не редактировать руками.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const INDEX_PATH = process.env.OC_INDEX || resolve(ROOT, '.superagents/memory/session-index.json');
const OUT_PATH = process.env.OC_OUT || resolve(ROOT, '.superagents/memory/context.md');
const SESSIONS_DIR = resolve(ROOT, 'docs/sessions');
const MANIFEST_PATH = resolve(ROOT, 'docs/manifest.json');
const PROJECT_ALIASES = [
  ROOT.toLowerCase().replace(/\\/g, '/'),
  'c:/users/evgeny/desktop/доник',
  'c:/users/evgeny/downloads/ai-os-new-main',
  'c:/users/evgeny/desktop/new folder',
];

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.trim() : '';
}
function gitLines(args, max = 10) {
  const out = git(args);
  if (!out) return [];
  return out.split('\n').slice(0, max);
}

const lines = [];
const add = (s = '') => lines.push(s);

add(`# Контекст: SuperAgents OS — ${new Date().toISOString().slice(0, 10)}`);
add('## Подтверждено');
add(`- Ветка: ${git(['branch', '--show-current']) || '(no branch)'} @ ${git(['rev-parse', '--short', 'HEAD']) || '?'} ${git(['rev-parse', 'HEAD'])}`);
add(`- HEAD±5:`);
for (const l of gitLines(['log', '--oneline', '-6'])) add(`  - ${l}`);
add(`- Статус: ${git(['status', '--porcelain']).split('\n').filter(Boolean).length} грязных файлов`);
const dirty = gitLines(['status', '--porcelain'], 10);
for (const l of dirty) add(`  - ${l}`);
const stash = gitLines(['stash', 'list'], 5);
if (stash.length) {
  add(`- Stash (${stash.length}):`);
  for (const l of stash) add(`  - ${l}`);
} else {
  add('- Stash: нет');
}
const unpushed = git(['log', '--oneline', '@{u}..HEAD']);
if (unpushed) {
  add(`- Не запушено (${unpushed.split('\n').length}):`);
  for (const l of unpushed.split('\n').slice(0, 5)) add(`  - ${l}`);
}

let index = null;
try {
  index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
} catch {
  add('- Индекс сессий: отсутствует (запусти `node scripts/opencode/session-index.mjs`)');
}

const cwdKey = ROOT.toLowerCase().replace(/\\/g, '/');
let mySessions = [];
if (index && index.byDirectory) {
  for (const [dir, bucket] of Object.entries(index.byDirectory)) {
    if (PROJECT_ALIASES.includes(dir.toLowerCase().replace(/\\/g, '/'))) {
      mySessions = mySessions.concat(bucket.sessions);
    }
  }
}

const recent = mySessions.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
if (recent.length) {
  add(`- Последние сессии проекта (${mySessions.length} всего):`);
  for (const s of recent) {
    const open = s.openTodos ? `, открытых todo: ${s.openTodos}` : '';
    add(`  - ${new Date(s.updatedAt).toISOString().slice(0, 10)} | ${s.version} | ${(s.title || 'без названия').slice(0, 60)}${open}`);
  }
} else {
  add('- Сессии проекта в индексе: не найдено (фильтр по directory)');
}

let lastCheckpoint = null;
try {
  const files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.md'));
  if (files.length) {
    lastCheckpoint = files.map((f) => ({ f, t: statSync(join(SESSIONS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
  }
} catch { /* нет каталога — ок */ }

if (lastCheckpoint) {
  add(`- Последняя контрольная точка: docs/sessions/${lastCheckpoint.f}`);
  const cp = readFileSync(join(SESSIONS_DIR, lastCheckpoint.f), 'utf8').split('\n').slice(0, 40);
  add('  - содержание (первые 40 строк):');
  for (const l of cp) if (l.trim()) add(`    ${l}`);
} else {
  add('- Контрольные точки: нет (создай первую через /checkpoint)');
}

add('');
add('## Куда смотреть (ссылки, не содержимое)');
add('- Wiki: docs/wiki/README.md, docs/manifest.json');
try {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const rnd = manifest.articles.slice(0, 4);
  add('- Релевантные статьи (примеры из manifest):');
  for (const a of rnd) add(`  - [${a.title.slice(0, 60)}] (docs/wiki/${a.slug}.md)`);
} catch { /* нет manifest */ }
add('- Агенты: .superagents/{RULES,ARCHITECTURE,CODING}.md');

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join('\n') + '\n', 'utf8');
console.log('Контекст записан:', OUT_PATH);
console.log('Строк:', lines.length);
