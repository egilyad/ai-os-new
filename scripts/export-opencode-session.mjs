#!/usr/bin/env node
/**
 * export-opencode-session.mjs
 *
 * Записывает сессию opencode в вики проекта (docs/wiki/sessions/) и обновляет индекс.
 *
 * Использование:
 *   node scripts/export-opencode-session.mjs --title "Тема" \
 *       [--date 2026-10-29] [--agent "opencode (mercury-3)"] [--body path/to/file.md]
 *   cat transcript.md | node scripts/export-opencode-session.mjs --title "Тема"
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSIONS_DIR = join(ROOT, 'docs', 'wiki', 'sessions');
const INDEX_FILE = join(ROOT, 'docs', 'wiki', 'sessions.md');

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
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'session';
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readBody(arg) {
  if (arg && arg !== '-' && existsSync(arg)) return readFileSync(arg, 'utf8');
  if (arg && arg !== '-') return arg; // inline body
  return ''; // stdin fallback below
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function renderIndex(files) {
  const lines = [
    '<!-- Сессии opencode: индекс (автосгенерировано scripts/export-opencode-session.mjs). -->',
    '',
    '# Сессии (opencode)',
    '',
    '> Раздел: **Сессии (opencode)** · Статус: verified · Теги: сессия, журнал, агент',
    '>',
    '> Сохраняются сессии агента opencode в markdown — прямо в вики проекта.',
    '',
    'Каждая сессия — отдельный файл в `docs/wiki/sessions/`. Формат: `YYYY-MM-DD-<тема>.md`.',
    '',
    '## Журнал сессий',
    '',
  ];
  const sorted = [...files].sort((a, b) => (a < b ? 1 : -1));
  for (const f of sorted) {
    const name = basename(f, extname(f));
    lines.push(`- [${name}](./sessions/${f})`);
  }
  lines.push('');
  return lines.join('\n');
}

const args = parseArgs(process.argv.slice(2));
const title = args.title || 'session';
const date = args.date || todayIso();
const agent = args.agent || 'opencode (mercury-3)';

const body = readBody(args.body) || (await readStdin());
if (!body.trim()) {
  console.error('[sessions] empty body — pass --body <file> or pipe stdin');
  process.exit(1);
}

mkdirSync(SESSIONS_DIR, { recursive: true });
const file = `${date}-${slugify(title)}.md`;
const doc = [
  `<!-- Сессия opencode: ${file} (записана scripts/export-opencode-session.mjs). -->`,
  '',
  `# Сессия opencode — ${title} (${date})`,
  '',
  '> Раздел: **Сессии (opencode)** · Статус: verified · Теги: сессия, агент',
  '>',
  `> Агент: ${agent} · Дата: ${date}`,
  '',
  body.trim(),
  '',
].join('\n');

writeFileSync(join(SESSIONS_DIR, file), doc);

const files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.md'));
writeFileSync(INDEX_FILE, renderIndex(files));

console.log(`[sessions] wrote docs/wiki/sessions/${file}`);
console.log(`[sessions] updated ${INDEX_FILE}`);
