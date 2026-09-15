/**
 * ModuleSettingsService tests — AGEMS port Phase 7.2.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleSettingsService } from './module-settings-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeKeyValueDb() {
    const store = new Map<string, { id: string; value: unknown }>();
    return {
        keyValue: {
            get: async (id: string) => store.get(id),
            put: async (record: { id: string; value: unknown }) => { store.set(record.id, record); return record.id; },
        },
    };
}

describe('ModuleSettingsService', () => {
    let db: ReturnType<typeof makeKeyValueDb>;
    let svc: ModuleSettingsService;

    beforeEach(async () => {
        db = makeKeyValueDb();
        svc = new ModuleSettingsService(db);
        await svc.init();
    });

    it('initializes with default modules', () => {
        const all = svc.getAll();
        expect(all.length).toBeGreaterThanOrEqual(5);
        expect(all.every(s => s.activityLevel >= 1 && s.activityLevel <= 5)).toBe(true);
        expect(all.every(s => s.autonomyLevel >= 1 && s.autonomyLevel <= 5)).toBe(true);
    });

    it('gets a specific module', () => {
        const lenses = svc.get('lenses');
        expect(lenses).toBeDefined();
        expect(lenses?.enabled).toBe(true);
    });

    it('returns undefined for unknown module', () => {
        expect(svc.get('nonexistent')).toBeUndefined();
    });

    it('updates a module', async () => {
        const updated = await svc.update('lenses', { activityLevel: 5, autonomyLevel: 1 });
        expect(updated.activityLevel).toBe(5);
        expect(updated.autonomyLevel).toBe(1);
        expect(svc.get('lenses')?.activityLevel).toBe(5);
    });

    it('creates a new module if not exists', async () => {
        const created = await svc.update('new-module', { enabled: false });
        expect(created.moduleId).toBe('new-module');
        expect(created.enabled).toBe(false);
        expect(svc.get('new-module')).toBeDefined();
    });

    it('persists across re-init', async () => {
        await svc.update('lenses', { activityLevel: 1 });
        const svc2 = new ModuleSettingsService(db);
        await svc2.init();
        expect(svc2.get('lenses')?.activityLevel).toBe(1);
    });

    it('resets a module to defaults', async () => {
        await svc.update('lenses', { activityLevel: 1 });
        await svc.reset('lenses');
        expect(svc.get('lenses')?.activityLevel).toBe(3);
    });

    it('resets all modules to defaults', async () => {
        await svc.update('lenses', { activityLevel: 1 });
        await svc.resetAll();
        expect(svc.get('lenses')?.activityLevel).toBe(3);
    });
});
