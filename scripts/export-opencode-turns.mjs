#!/usr/bin/env node
/**
 * export-opencode-turns.mjs
 *
 * Сохраняет каждый ответ ассистента opencode как отдельный .md в вики.
 *
 * Источник: SQLite-база opencode (~/.local/share/opencode/opencode.db).
 * Куда пишет:
 *   - источник: docs/sessions/turns/<дата>-<seq>-<slug>.md
 *   - зеркало для вики: docs/wiki/sessions/turns/<дата>-<seq>-<slug>.md
 *   - индексы: docs/sessions/turns/README.md и docs/wiki/sessions/turns/README.md
 *
 * Использование:
 *   node scripts/export-opencode-turns.mjs                # последняя сессия
 *   node scripts/export-opencode-turns.mjs --session <id> # конкретная сессия
 *   node scripts/export-opencode-turns.mjs --dir ai-os     # последняя по подстроке каталога
 */
import { DatabaseSync } from 'node:sqlite';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function homeDir() {
  return process.env.USERPROFILE || process.env.HOME || '';
}

function dbPath() {
  const p = join(homeDir(), '.local', 'share', 'opencode', 'opencode.db');
  if (existsSync(p)) return p;
  const env = process.env.OPENCODE_DB;
  if (env && existsSync(env)) return env;
  throw new Error('opencode.db not found; set OPENCODE_DB');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      const val = next && !next.startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'turn'
  );
}

function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function renderTurnsIndex(files) {
  const lines = [
    '<!-- Ответы ассистента opencode: индекс (автосгенерировано scripts/export-opencode-turns.mjs). -->',
    '',
    '# Ответы ассистента (opencode)',
    '',
    'Каждый ответ — отдельный .md (по одному файлу на ответ).',
    'Формат имени: `YYYY-MM-DD-<seq>-<тема>.md`.',
    '',
    '## Журнал ответов',
    '',
  ];
  const sorted = [...files].sort((a, b) => (a < b ? 1 : -1));
  for (const f of sorted) {
    const name = basename(f, extname(f));
    lines.push(`- [${name}](./${f})`);
  }
  lines.push('');
  return lines.join('\n');
}

function pickSession(db, args) {
  const get = db.prepare(
    'SELECT id, directory, title, time_created FROM session ORDER BY time_updated DESC LIMIT 1',
  );
  const latest = get.get();
  if (args.session) {
    const byId = db.prepare('SELECT id, directory, title, time_created FROM session WHERE id = ?').get(args.session);
    if (byId) return byId;
  }
  if (args.dir) {
    const rows = db
      .prepare('SELECT id, directory, title, time_created FROM session WHERE directory LIKE ? ORDER BY time_updated DESC LIMIT 1')
      .all(`%${args.dir}%`);
    if (rows.length) return rows[0];
  }
  return latest;
}

const args = parseArgs(process.argv.slice(2));
const db = new DatabaseSync(dbPath(), { readOnly: true });
const session = pickSession(db, args);
if (!session) {
  console.error('[turns] no session found');
  process.exit(1);
}

const messages = db
  .prepare('SELECT id, time_created, data FROM message WHERE session_id = ? ORDER BY time_created')
  .all(session.id);

const partsByMessage = new Map();
const parts = db
  .prepare('SELECT message_id, data FROM part WHERE session_id = ? ORDER BY time_created')
  .all(session.id);
for (const p of parts) {
  try {
    const d = JSON.parse(p.data);
    if (d && d.type === 'text' && typeof d.text === 'string') {
      const list = partsByMessage.get(p.message_id) ?? [];
      list.push(d.text);
      partsByMessage.set(p.message_id, list);
    }
  } catch {
    /* ignore malformed part */
  }
}

const turns = [];
for (const m of messages) {
  let meta;
  try {
    meta = JSON.parse(m.data);
  } catch {
    continue;
  }
  if (meta.role !== 'assistant') continue;
  const text = (partsByMessage.get(m.id) ?? []).join('\n\n').trim();
  if (!text) continue;
  const ts = m.time_created || Date.now();
  turns.push({ ts, text });
}

if (turns.length === 0) {
  console.log(`[turns] no assistant text turns in session ${session.id}`);
  process.exit(0);
}

const srcDir = join(ROOT, 'docs', 'sessions', 'turns');
const mirrorDir = join(ROOT, 'docs', 'wiki', 'sessions', 'turns');
mkdirSync(srcDir, { recursive: true });
mkdirSync(mirrorDir, { recursive: true });

const written = [];
turns.forEach((turn, i) => {
  const seq = String(i + 1).padStart(3, '0');
  const firstLine = turn.text.split('\n').find((l) => l.trim()) ?? '';
  const slug = slugify(firstLine);
  const name = `${isoDate(turn.ts)}-${seq}-${slug}.md`;
  const doc = [
    `<!-- Ответ ассистента opencode: ${name} (scripts/export-opencode-turns.mjs). -->`,
    '',
    `# Ответ ${seq} · ${isoDate(turn.ts)}`,
    '',
    `> Сессия: ${session.id} · Раздел: **Сессии (opencode)** · Статус: verified`,
    '',
    turn.text,
    '',
  ].join('\n');
  writeFileSync(join(srcDir, name), doc);
  writeFileSync(join(mirrorDir, name), doc);
  written.push(name);
});

const srcFiles = readdirSync(srcDir).filter((f) => f.endsWith('.md'));
writeFileSync(join(srcDir, 'README.md'), renderTurnsIndex(srcFiles));
const mirrorFiles = readdirSync(mirrorDir).filter((f) => f.endsWith('.md'));
writeFileSync(join(mirrorDir, 'README.md'), renderTurnsIndex(mirrorFiles));

console.log(`[turns] session ${session.id} (${session.title || 'untitled'})`);
console.log(`[turns] ${written.length} assistant answers -> docs/sessions/turns/ + docs/wiki/sessions/turns/`);
