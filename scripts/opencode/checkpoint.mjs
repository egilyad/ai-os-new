// checkpoint.mjs — v0: создать контрольную точку docs/sessions/YYYY-MM-DD-<slug>.md
// по шаблону. Факты (git) собираются здесь; содержательные секции заполняет модель/человек.
// Использование: node scripts/opencode/checkpoint.mjs [slug]

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SESSIONS_DIR = resolve(ROOT, 'docs/sessions');

const slug = process.argv[2] || 'session';
const date = new Date().toISOString().slice(0, 10);
const filename = `${date}-${slug}.md`;
const path = resolve(SESSIONS_DIR, filename);

if (existsSync(path)) {
  console.error(`Контрольная точка уже существует: ${path}`);
  process.exit(1);
}

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.trim() : '';
}

const branch = git(['branch', '--show-current']) || '(no branch)';
const head = git(['rev-parse', '--short', 'HEAD']);
const porcelain = git(['status', '--porcelain']).split('\n').filter(Boolean);
const diffStat = git(['diff', '--stat']).split('\n').filter(Boolean).slice(0, 20);
const todos = git(['log', '--oneline', '-5']).split('\n').filter(Boolean);

const template = `# ${date} — ${slug}

Статус: in-progress

## Цель сессии

## Что сделано (файлы + коммиты)

## Принятые решения (+ почему; кандидат в ADR?)

## Обнаруженные проблемы / гипотезы

## Результаты проверок (typecheck/lint/test — что запускалось)

## Следующий логический шаг

---
## Факты (авто, из checkpoint.mjs)
- Ветка: ${branch} @ ${head}
- Изменённых файлов: ${porcelain.length}
${porcelain.slice(0, 10).map((l) => '  - ' + l).join('\n')}
- Diff stat:
${diffStat.map((l) => '  - ' + l).join('\n')}
- Последние коммиты:
${todos.map((l) => '  - ' + l).join('\n')}
`;

mkdirSync(SESSIONS_DIR, { recursive: true });
writeFileSync(path, template, 'utf8');
console.log('Контрольная точка создана:', path);
console.log('Заполни содержательные секции (цель/сделано/решения/следующий шаг) и закоммить.');
