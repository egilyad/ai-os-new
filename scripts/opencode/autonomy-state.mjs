// autonomy-state.mjs — управление файлом прогресса AUTONOMOUS_PROGRESS.md
// Режимы: step-by-step (по умолчанию), batch, full-autonomous
// Поля: current_phase, completed[], in_progress, pending[], blockers[], last_checkpoint

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const STATE_FILE = resolve(ROOT, 'AUTONOMOUS_PROGRESS.md');

const DEFAULT_STATE = `# AUTONOMOUS_PROGRESS

Режим: step-by-step
Обновлено: ${new Date().toISOString().slice(0, 10)}

## Current phase
P0

## Completed
- (пусто)

## In progress
- (пусто)

## Pending
- P0: инициализация и настройка (см. docs/UNIFIED_PLAN.md)

## Blockers
- (нет)

## Last checkpoint
- (нет)
`;

function readState() {
    if (!existsSync(STATE_FILE)) return DEFAULT_STATE;
    return readFileSync(STATE_FILE, 'utf8');
}

function writeState(content) {
    mkdirSync(dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, content, 'utf8');
}

function parseSection(content, name) {
    const m = content.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`));
    if (!m) return [];
    return m[1]
        .split('\n')
        .map((l) => l.replace(/^-\s*/, '').trim())
        .filter(Boolean);
}

function setSection(content, name, items) {
    const body = items.length ? items.map((i) => `- ${i}`).join('\n') : '- (пусто)';
    if (content.includes(`## ${name}`)) {
        return content.replace(new RegExp(`## ${name}\\n[\\s\\S]*?(?=\\n## |$)`), `## ${name}\n${body}\n`);
    }
    return `${content}\n## ${name}\n${body}\n`;
}

function printState() {
    const content = readState();
    console.log(content);
}

function updateState(opts) {
    let content = readState();
    if (opts.mode) {
        content = content.replace(/Режим: .*/, `Режим: ${opts.mode}`);
    }
    if (opts.complete) {
        const completed = parseSection(content, 'Completed');
        completed.push(opts.complete);
        content = setSection(content, 'Completed', completed);
        const pending = parseSection(content, 'Pending').filter((p) => p !== opts.complete);
        content = setSection(content, 'Pending', pending);
        const inProgress = parseSection(content, 'In progress').filter((p) => p !== opts.complete);
        content = setSection(content, 'In progress', inProgress);
    }
    if (opts.start) {
        const inProgress = parseSection(content, 'In progress');
        inProgress.push(opts.start);
        content = setSection(content, 'In progress', inProgress);
        const pending = parseSection(content, 'Pending').filter((p) => p !== opts.start);
        content = setSection(content, 'Pending', pending);
    }
    if (opts.blocker) {
        const blockers = parseSection(content, 'Blockers');
        blockers.push(opts.blocker);
        content = setSection(content, 'Blockers', blockers);
    }
    if (opts.checkpoint) {
        content = content.replace(/## Last checkpoint\n[^\n]*/, `## Last checkpoint\n- ${opts.checkpoint}`);
    }
    if (opts.phase) {
        content = content.replace(/## Current phase\n[^\n]*/, `## Current phase\n${opts.phase}`);
    }
    content = content.replace(/Обновлено: .*/, `Обновлено: ${new Date().toISOString().slice(0, 10)}`);
    writeState(content);
    console.log('AUTONOMOUS_PROGRESS.md обновлён');
    printState();
}

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--mode') opts.mode = args[++i];
    else if (a === '--complete') opts.complete = args[++i];
    else if (a === '--start') opts.start = args[++i];
    else if (a === '--blocker') opts.blocker = args[++i];
    else if (a === '--checkpoint') opts.checkpoint = args[++i];
    else if (a === '--phase') opts.phase = args[++i];
}

if (Object.keys(opts).length === 0) {
    printState();
} else {
    updateState(opts);
}
