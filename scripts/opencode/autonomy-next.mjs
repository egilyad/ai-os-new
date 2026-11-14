// autonomy-next.mjs — предлагает следующую задачу из UNIFIED_PLAN.md
// Читает план, находит первый пункт в фазах и выдаёт его как кандидата.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const PLAN_FILE = resolve(ROOT, 'docs/UNIFIED_PLAN.md');
const STATE_FILE = resolve(ROOT, 'AUTONOMOUS_PROGRESS.md');

function parsePlan() {
    if (!existsSync(PLAN_FILE)) return [];
    const content = readFileSync(PLAN_FILE, 'utf8');
    const lines = content.split('\n');
    const phases = [];
    let currentPhase = null;
    for (const line of lines) {
        const phaseMatch = line.match(/^##\s+(\d+[a-zа-я]*)\s*[.—-]?\s*(.*)/i);
        const itemMatch = line.match(/^###\s+(.*)/);
        if (phaseMatch) {
            currentPhase = { id: phaseMatch[1].trim(), title: phaseMatch[2].trim(), items: [] };
            phases.push(currentPhase);
        } else if (itemMatch && currentPhase) {
            currentPhase.items.push(itemMatch[1].trim());
        }
    }
    return phases;
}

function readProgress() {
    if (!existsSync(STATE_FILE)) return { inProgress: [], completed: [] };
    const content = readFileSync(STATE_FILE, 'utf8');
    const section = (name) => {
        const m = content.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`));
        if (!m) return [];
        return m[1].split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean);
    };
    return { inProgress: section('In progress'), completed: section('Completed') };
}

const phases = parsePlan();
const progress = readProgress();

console.log('=== Следующая задача (Autonomy Governor) ===');
console.log('');

if (phases.length === 0) {
    console.log('План не найден: docs/UNIFIED_PLAN.md');
    process.exit(0);
}

let found = false;
for (const phase of phases) {
    for (const item of phase.items) {
        const key = `${phase.id}: ${item}`;
        const isDone = progress.completed.some((c) => c.includes(item) || item.includes(c));
        const isInProgress = progress.inProgress.some((c) => c.includes(item) || item.includes(c));
        if (isDone || isInProgress) continue;
        console.log(`Фаза ${phase.id}: ${phase.title}`);
        console.log(`Задача: ${item}`);
        console.log(`Команда: node scripts/opencode/autonomy-state.mjs --start "${key}"`);
        found = true;
        break;
    }
    if (found) break;
}

if (!found) {
    console.log('Все задачи из плана выполнены или в работе. Проверь AUTONOMOUS_PROGRESS.md');
}
