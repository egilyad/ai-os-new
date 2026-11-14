// import-roadmap.mjs — парсит Markdown-роадмап и выводит задачи (кандидаты в AGEMS).
// Использование: node scripts/opencode/import-roadmap.mjs <path-to-roadmap.md>
// Опции: --json (вывод JSON), --limit N (макс. задач), --min-words N (мин. длина заголовка)

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const jsonOutput = args.includes('--json');
const limit = Number(args[args.indexOf('--limit') + 1] ?? 50);
const minWords = Number(args[args.indexOf('--min-words') + 1] ?? 3);

if (!fileArg) {
    console.error('Использование: node scripts/opencode/import-roadmap.mjs <path-to-roadmap.md> [--json] [--limit N] [--min-words N]');
    process.exit(1);
}

const file = resolve(fileArg);
if (!existsSync(file)) {
    console.error(`Файл не найден: ${file}`);
    process.exit(1);
}

const content = readFileSync(file, 'utf8');
const lines = content.split('\n');

const tasks = [];
let currentSection = '';

for (const line of lines) {
    const sectionMatch = line.match(/^#{2,3}\s+(.*)/);
    if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        continue;
    }
    const itemMatch = line.match(/^[-*]\s+\[( |x)\]\s+(.*)/);
    if (itemMatch) {
        const title = itemMatch[2].trim();
        const words = title.split(/\s+/).length;
        if (words < minWords) continue;
        tasks.push({
            section: currentSection,
            title,
            done: itemMatch[1] === 'x',
            source: file,
        });
        continue;
    }
    const boldMatch = line.match(/^\*\*(.*)\*\*\s*[—–-]\s+(.*)/);
    if (boldMatch && boldMatch[1].length > 10) {
        tasks.push({
            section: currentSection,
            title: `${boldMatch[1].trim()} — ${boldMatch[2].trim().slice(0, 120)}`,
            done: false,
            source: file,
        });
    }
}

const pending = tasks.filter((t) => !t.done).slice(0, limit);

if (jsonOutput) {
    console.log(JSON.stringify({ file, total: tasks.length, pending: pending.length, tasks: pending }, null, 2));
} else {
    console.log(`Файл: ${file}`);
    console.log(`Всего пунктов: ${tasks.length}, к выполнению: ${pending.length}\n`);
    for (const t of pending) {
        console.log(`[${t.section || 'unsorted'}] ${t.title}`);
    }
    console.log('\nСледующий шаг: перенести эти задачи в AGEMS (tasks.create) или использовать /autonomy-next.');
}
