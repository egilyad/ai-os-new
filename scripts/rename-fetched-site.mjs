#!/usr/bin/env node
/**
 * rename-fetched-site.mjs
 *
 * Переименовывает страницы внутри папки скачанного сайта по их заголовкам
 * и (опционально) саму папку. Переписывает внутренние markdown-ссылки.
 *
 * Использование:
 *   node scripts/rename-fetched-site.mjs --dir "docs/fetched-sites/сайт-без-названия-1HmVUSU7" [--name "аудит-777"]
 */
import { readdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      args[a.slice(2)] = next && !next.startsWith('--') ? argv[++i] : true;
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
      .replace(/-+/g, '-')
      .slice(0, 50) || 'page'
  );
}

const GENERIC = /главная|index|untitled|сайт[-\s]*без[-\s]*названия|без[-\s]*названия/i;
function headingOf(file) {
  try {
    const s = readFileSync(file, 'utf8').slice(0, 60000);
    for (const line of s.split('\n')) {
      const m = line.match(/^#\s+(.+)$/);
      if (m && m[1].trim().length >= 3 && !GENERIC.test(m[1])) return m[1].trim();
    }
    const t = s.match(/<title>([^<]+)<\/title>/i);
    if (t && t[1].trim().length >= 3 && !GENERIC.test(t[1])) return t[1].trim();
  } catch {}
  return '';
}

const args = parseArgs(process.argv.slice(2));
const dirArg = args.dir;
if (!dirArg || !existsSync(dirArg)) {
  console.error('usage: node scripts/rename-fetched-site.mjs --dir <path> [--name <folder-slug>]');
  process.exit(1);
}
const dir = dirArg.startsWith('docs/') || dirArg.startsWith('docs\\') ? join(ROOT, dirArg) : dirArg;

const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'index.md');
const used = new Set();
const mapping = new Map();

for (const f of files.sort()) {
  const h = headingOf(join(dir, f));
  let slug = slugify(h || basename(f, '.md'));
  let n = slug;
  let i = 2;
  while (used.has(n)) n = `${slug}-${i++}`;
  used.add(n);
  mapping.set(f, `${n}.md`);
}

// rewrite internal links in every md file
for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
  const p = join(dir, f);
  let content = readFileSync(p, 'utf8');
  for (const [oldName, newName] of mapping) {
    content = content.split(oldName).join(newName);
  }
  writeFileSync(p, content);
}

// rename files
for (const [oldName, newName] of mapping) {
  if (oldName === newName) continue;
  renameSync(join(dir, oldName), join(dir, newName));
  console.log(`  ${oldName} -> ${newName}`);
}

// rename folder
if (args.name) {
  const target = join(dirname(dir), String(args.name));
  if (target !== dir && !existsSync(target)) {
    renameSync(dir, target);
    console.log(`folder -> ${basename(target)}`);
  }
}

console.log('done');
