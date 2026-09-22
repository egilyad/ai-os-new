import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const AUTOCYCLE_FILE = path.join(DATA_DIR, 'autocycle.json');

// Фаза 0: страховочная инфраструктура автоцикла.
// Kill-switch: AUTOCYCLE_ENABLED=1 (по умолчанию ВЫКЛЮЧЕН — безопасно).
// Лимит итераций: AUTOCYCLE_MAX_ITERATIONS в сутки на компанию (дефолт 10).
// Гарды действуют ТОЛЬКО на schedule-триггер (автономный путь);
// ручные wakeups (manual/approval/comment/assignment) идут как раньше.

export function isAutocycleEnabled() {
    return process.env.AUTOCYCLE_ENABLED === '1';
}

export function maxIterations() {
    const n = Number(process.env.AUTOCYCLE_MAX_ITERATIONS || '10');
    if (!Number.isFinite(n) || n < 0) return 10;
    return Math.floor(n);
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function readState() {
    try {
        if (!fs.existsSync(AUTOCYCLE_FILE)) return { counts: {} };
        const raw = fs.readFileSync(AUTOCYCLE_FILE, 'utf8');
        if (!raw.trim()) return { counts: {} };
        const db = JSON.parse(raw);
        return { counts: db.counts && typeof db.counts === 'object' ? db.counts : {} };
    } catch {
        return { counts: {} };
    }
}

function saveState(state) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${AUTOCYCLE_FILE}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, AUTOCYCLE_FILE);
}

export function autocycleUsage(companyId, month = todayKey()) {
    const day = String(month).slice(0, 10);
    const rec = readState().counts[String(companyId)];
    if (!rec || rec.day !== day) return 0;
    return Number(rec.used) || 0;
}

export function consumeAutocycleSlot(companyId) {
    if (!isAutocycleEnabled()) return { allowed: false, reason: 'autocycle disabled (AUTOCYCLE_ENABLED!=1)' };
    const max = maxIterations();
    const day = todayKey();
    const state = readState();
    const rec = state.counts[String(companyId)] || { day, used: 0 };
    const used = rec.day === day ? Number(rec.used) || 0 : 0;
    if (used >= max) {
        return { allowed: false, reason: `autocycle budget exhausted (${used}/${max} today)` };
    }
    state.counts[String(companyId)] = { day, used: used + 1 };
    saveState(state);
    return { allowed: true, used: used + 1, max };
}
