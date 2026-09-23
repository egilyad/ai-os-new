/**
 * Cron Builder — AGEMS 2.3
 * Presets + human-readable preview
 */

const PRESETS: Record<string, { label: string; cron: string; description: string }> = {
    DAILY:  { label: 'Daily',  cron: '0 0 * * *',   description: 'Runs every day at 00:00' },
    WEEKDAY:{ label: 'Weekday', cron: '0 0 * * 1-5', description: 'Runs weekdays at 00:00' },
    WEEKLY: { label: 'Weekly', cron: '0 0 * * 0',   description: 'Runs every Sunday at 00:00' },
    MONTHLY:{ label: 'Monthly', cron: '0 0 1 * *',   description: 'Runs on the 1st of each month at 00:00' },
    HOURLY: { label: 'Hourly', cron: '0 * * * *',   description: 'Runs every hour at :00' },
};

export function getPreset(preset: string) {
    return PRESETS[preset] ?? null;
}

export function getPresets() {
    return Object.entries(PRESETS).map(([key, val]) => ({ key, ...val }));
}

export function formatCronPreview(schedule: CronSchedule): string {
    if (schedule.kind === 'preset') {
        const p = PRESETS[schedule.preset];
        return p ? p.description : schedule.preset;
    }
    // custom: "Runs at HH:MM on DD/MM" etc.
    const parts: string[] = [];
    parts.push(`minute ${schedule.minute}`);
    parts.push(`hour ${schedule.hour}`);
    if (schedule.dayOfMonth !== undefined) parts.push(`day ${schedule.dayOfMonth}`);
    if (schedule.month !== undefined) parts.push(`month ${schedule.month}`);
    if (schedule.weekday !== undefined) parts.push(`weekday ${schedule.weekday}`);
    return `Custom: ${parts.join(', ')}`;
}

export function cronToExpression(schedule: CronSchedule): string {
    if (schedule.kind === 'preset') {
        return PRESETS[schedule.preset]?.cron ?? '';
    }
    const m = schedule.minute;
    const h = schedule.hour;
    const dom = schedule.dayOfMonth ?? '*';
    const mon = schedule.month ?? '*';
    const dow = schedule.weekday ?? '*';
    return `${m} ${h} ${dom} ${mon} ${dow}`;
}

export function isValidCron(expr: string): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    return parts.every((p) => p === '*' || /^\d+$/.test(p) || /^[\d,\-\/\*]+$/.test(p));
}

export type CronSchedule = import('../types/agems-task').CronSchedule;
