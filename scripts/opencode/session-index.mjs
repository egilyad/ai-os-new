// session-index.mjs — v0: read-only индекс сессий OpenCode (V1, SQLite)
// Читает ТОЛЬКО метаданные (session/todo). Не трогает содержимое частей,
// не меняет БД, не запускает никаких служб.

import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_PATH = process.env.OC_DB || 'C:/Users/evgeny/.local/share/opencode/opencode.db';
const OUT_PATH = process.env.OC_OUT || resolve(dirname(fileURLToPath(import.meta.url)), '../../.superagents/memory/session-index.json');
const LIMIT_PER_DIR = Number(process.env.OC_LIMIT || 0); // 0 = все

const db = new DatabaseSync(`file:${DB_PATH}?mode=ro`, { readOnly: true });

const projects = db.prepare('SELECT id, worktree FROM project').all();
const projectByWorktree = new Map(projects.filter(p => p.worktree).map(p => [p.worktree.toLowerCase().replace(/\\/g, '/'), p.id]));

function projectFor(dir) {
  if (!dir) return null;
  const d = dir.toLowerCase().replace(/\\/g, '/');
  return projectByWorktree.get(d) || null;
}

const todos = db.prepare(`
  SELECT session_id,
         SUM(CASE WHEN status IN ('pending','in_progress') THEN 1 ELSE 0 END) AS open_todos,
         COUNT(*) AS total_todos
  FROM todo GROUP BY session_id
`).all();
const todoBySession = new Map(todos.map(t => [t.session_id, t]));

const dirs = db.prepare('SELECT DISTINCT directory FROM session WHERE directory IS NOT NULL').all()
  .map(r => r.directory);

const sessions = [];
for (const d of dirs) {
  let rows;
  if (LIMIT_PER_DIR > 0) {
    rows = db.prepare('SELECT * FROM session WHERE directory = ? ORDER BY time_created DESC LIMIT ?')
      .all(d, LIMIT_PER_DIR);
  } else {
    rows = db.prepare('SELECT * FROM session WHERE directory = ? ORDER BY time_created DESC').all(d);
  }
  for (const s of rows) {
    const td = todoBySession.get(s.id);
    sessions.push({
      id: s.id,
      projectId: s.project_id,
      matchedProject: projectFor(s.directory),
      directory: s.directory,
      title: s.title || null,
      version: s.version || null,
      agent: s.agent || null,
      model: s.model || null,
      createdAt: s.time_created,
      updatedAt: s.time_updated,
      additions: s.summary_additions ?? null,
      deletions: s.summary_deletions ?? null,
      files: s.summary_files ?? null,
      tokens: {
        input: s.tokens_input ?? null,
        output: s.tokens_output ?? null,
        reasoning: s.tokens_reasoning ?? null,
      },
      cost: s.cost ?? null,
      openTodos: td ? td.open_todos : 0,
      totalTodos: td ? td.total_todos : 0,
      archived: s.time_archived ? true : false,
    });
  }
}

sessions.sort((a, b) => b.createdAt - a.createdAt);

const byDirectory = {};
for (const s of sessions) {
  const key = s.directory;
  if (!byDirectory[key]) byDirectory[key] = { count: 0, openTodos: 0, sessions: [] };
  byDirectory[key].count += 1;
  byDirectory[key].openTodos += s.openTodos;
  byDirectory[key].sessions.push({
    id: s.id, title: s.title, version: s.version, agent: s.agent,
    createdAt: s.createdAt, updatedAt: s.updatedAt,
    additions: s.additions, deletions: s.deletions, files: s.files,
    openTodos: s.openTodos, totalTodos: s.totalTodos, archived: s.archived,
  });
}

const index = {
  generatedAt: Date.now(),
  source: DB_PATH,
  note: 'read-only индекс, метаданные без содержимого. Никогда не инжектится в промпт целиком.',
  schema: 'v0',
  totals: {
    sessions: sessions.length,
    directories: dirs.length,
    openTodos: sessions.reduce((a, s) => a + s.openTodos, 0),
  },
  byDirectory,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(index, null, 2), 'utf8');

console.log('Индекс записан:', OUT_PATH);
console.log('Всего сессий:', index.totals.sessions, '| папок:', index.totals.directories, '| открытых todo:', index.totals.openTodos);
console.log('Топ папок по сессиям:');
for (const [d, v] of Object.entries(byDirectory).sort((a, b) => b[1].count - a[1].count).slice(0, 10)) {
  console.log(`  ${v.count.toString().padStart(4)}  openTodos=${v.openTodos.toString().padStart(3)}  ${d}`);
}

db.close();
