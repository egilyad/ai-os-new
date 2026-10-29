#!/usr/bin/env node
/**
 * rename-fetched-untitled.mjs
 *
 * Проходит по папкам «сайт-без-названия-*» в docs/fetched-sites/, даёт им имена
 * по содержимому и переименовывает страницы по заголовкам. Пустые (0 страниц)
 * и папки без осмысленного заголовка пропускаются.
 */
import { readdirSync, readFileSync, writeFileSync, renameSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs', 'fetched-sites');

const GENERIC_HEADING = /главная|index|untitled|сайт[-\s]*без[-\s]*названия|без[-\s]*названия/i;

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

function headingOf(file) {
  try {
    const s = readFileSync(file, 'utf8').slice(0, 60000);
    for (const line of s.split('\n')) {
      const m = line.match(/^#\s+(.+)$/);
      if (m && m[1].trim().length >= 3 && !GENERIC_HEADING.test(m[1])) return m[1].trim();
    }
    const t = s.match(/<title>([^<]+)<\/title>/i);
    if (t && t[1].trim().length >= 3 && !GENERIC_HEADING.test(t[1])) return t[1].trim();
  } catch {}
  return '';
}

function siteTitle(dir) {
  const h = headingOf(join(SRC, dir, 'index.md'));
  if (h) return h;
  let best = '';
  const files = readdirSync(join(SRC, dir)).filter((f) => f.endsWith('.md'));
  for (const f of files.slice(0, 20)) {
    const hh = headingOf(join(SRC, dir, f));
    if (hh && hh.length > best.length) best = hh;
  }
  return best;
}

const dirs = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory() && /сайт-без-названия/i.test(d));
const usedFolders = new Set(readdirSync(SRC).filter((d) => !/сайт-без-названия/i.test(d)));

let renamed = 0;
let skippedEmpty = 0;
let skippedNoTitle = 0;

for (const dir of dirs) {
  const dirPath = join(SRC, dir);
  const files = readdirSync(dirPath).filter((f) => f.endsWith('.md') && f !== 'index.md');
  if (files.length === 0) {
    skippedEmpty++;
    continue;
  }
  const title = siteTitle(dir);
  if (!title) {
    skippedNoTitle++;
    continue;
  }

  // rename pages by headings
  const used = new Set();
  const mapping = new Map();
  for (const f of files.sort()) {
    const h = headingOf(join(dirPath, f));
    let slug = slugify(h || basename(f, '.md'));
    let n = slug;
    let i = 2;
    while (used.has(n)) n = `${slug}-${i++}`;
    used.add(n);
    mapping.set(f, `${n}.md`);
  }
  for (const f of readdirSync(dirPath).filter((x) => x.endsWith('.md'))) {
    const p = join(dirPath, f);
    let content = readFileSync(p, 'utf8');
    for (const [o, nw] of mapping) content = content.split(o).join(nw);
    writeFileSync(p, content);
  }
  for (const [o, nw] of mapping) {
    if (o !== nw) renameSync(join(dirPath, o), join(dirPath, nw));
  }

  // rename folder to unique slug
  let folderSlug = slugify(title);
  let fn = folderSlug;
  let i = 2;
  while (usedFolders.has(fn)) fn = `${folderSlug}-${i++}`;
  usedFolders.add(fn);
  if (fn !== dir) renameSync(dirPath, join(SRC, fn));
  console.log(`${dir} -> ${fn} (pages: ${mapping.size})`);
  renamed++;
}

console.log(`summary: renamed=${renamed}, skippedEmpty=${skippedEmpty}, skippedNoTitle=${skippedNoTitle}`);
