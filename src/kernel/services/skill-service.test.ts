import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillService } from './skill-service';
import type { SkillServiceDeps } from './skill-service';
import type { CognitiveSkill } from '../types/domain-types';

function createMockSkillsStore() {
    let store: CognitiveSkill[] = [];
    return {
        count: vi.fn().mockImplementation(async () => store.length),
        toArray: vi.fn().mockImplementation(async () => [...store]),
        bulkAdd: vi.fn().mockImplementation(async (items: CognitiveSkill[]) => {
            store.push(...items);
        }),
        bulkPut: vi.fn().mockImplementation(async (items: CognitiveSkill[]) => {
            store = [...items];
        }),
        loadAll: vi.fn(),
        saveAll: vi.fn(),
        clear: vi.fn(),
        exportAll: vi.fn(),
        importAll: vi.fn(),
    };
}

function makeSkill(overrides?: Partial<CognitiveSkill>): CognitiveSkill {
    return {
        id: 'sk-custom',
        name: 'Custom',
        description: 'x',
        category: 'analysis',
        status: 'active',
        toolsUsed: [],
        version: '1.0',
        executionCount: 0,
        ...overrides,
    } as CognitiveSkill;
}

function createDeps(): SkillServiceDeps {
    return {
        eventBus: { emit: vi.fn(), emitOnce: vi.fn(() => true) },
        skillsStore: createMockSkillsStore(),
    };
}

describe('SkillService', () => {
    let deps: SkillServiceDeps;
    let svc: SkillService;

    beforeEach(() => {
        deps = createDeps();
        svc = new SkillService(deps);
    });

    describe('init', () => {
        it('should load default skills when store is empty', async () => {
            await svc.init();
            const skills = svc.getSkills();
            expect(skills.length).toBeGreaterThanOrEqual(5);
            expect(skills[0].name).toBe('Deep Web Researcher');
        });

        it('should load from store when data exists', async () => {
            const existing = makeSkill({ id: 'sk-custom', name: 'Custom' });
            deps.skillsStore.count = vi.fn().mockResolvedValue(1);
            deps.skillsStore.toArray = vi.fn().mockResolvedValue([existing]);
            await svc.init();
            expect(svc.getSkills().length).toBe(1);
            expect(svc.getSkills()[0].id).toBe('sk-custom');
        });

        it('should be idempotent', async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
            await svc.init();
            expect(deps.skillsStore.bulkAdd).toHaveBeenCalledTimes(1);
        });
    });

    describe('queries', () => {
        beforeEach(async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
        });

        it('getInstalled should exclude not_installed', () => {
            const installed = svc.getInstalled();
            expect(installed.every((s) => s.status !== 'not_installed')).toBe(true);
        });

        it('getAvailable should return only not_installed', () => {
            const available = svc.getAvailable();
            expect(available.every((s) => s.status === 'not_installed')).toBe(true);
        });
    });

    describe('toggleActive', () => {
        beforeEach(async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
        });

        it('should toggle active to installed', () => {
            const active = svc.getSkills().find((s) => s.status === 'active')!;
            svc.toggleActive(active.id);
            const updated = svc.getSkills().find((s) => s.id === active.id)!;
            expect(updated.status).toBe('installed');
        });

        it('should toggle installed to active', () => {
            const installed = svc.getSkills().find((s) => s.status === 'installed')!;
            svc.toggleActive(installed.id);
            const updated = svc.getSkills().find((s) => s.id === installed.id)!;
            expect(updated.status).toBe('active');
        });

        it('should not toggle not_installed skills', () => {
            const notInstalled = svc.getSkills().find((s) => s.status === 'not_installed')!;
            svc.toggleActive(notInstalled.id);
            const updated = svc.getSkills().find((s) => s.id === notInstalled.id)!;
            expect(updated.status).toBe('not_installed');
        });

        it('should emit event', () => {
            const active = svc.getSkills().find((s) => s.status === 'active')!;
            svc.toggleActive(active.id);
            expect(deps.eventBus.emit).toHaveBeenCalled();
        });
    });

    describe('installSkill', () => {
        beforeEach(async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
        });

        it('should install a not_installed skill', () => {
            const notInstalled = svc.getSkills().find((s) => s.status === 'not_installed')!;
            svc.installSkill(notInstalled.id);
            expect(svc.getSkills().find((s) => s.id === notInstalled.id)!.status).toBe('installed');
        });

        it('should emit event', () => {
            const notInstalled = svc.getSkills().find((s) => s.status === 'not_installed')!;
            svc.installSkill(notInstalled.id);
            expect(deps.eventBus.emit).toHaveBeenCalled();
        });
    });

    describe('incrementExecution', () => {
        beforeEach(async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
        });

        it('should increment execution count', () => {
            const skill = svc.getSkills()[0];
            const before = skill.executionCount;
            svc.incrementExecution(skill.id);
            expect(svc.getSkills().find((s) => s.id === skill.id)!.executionCount).toBe(before + 1);
        });
    });

    describe('export/import', () => {
        beforeEach(async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
        });

        it('should export skills as JSON string', () => {
            const json = svc.exportSkills();
            const parsed = JSON.parse(json);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBeGreaterThanOrEqual(5);
        });

        it('should import new skills', () => {
            const before = svc.getSkills().length;
            const newSkill = makeSkill({ id: 'sk-imported', name: 'Imported' });
            const imported = svc.importSkills(JSON.stringify([newSkill]));
            expect(imported).toBe(1);
            expect(svc.getSkills().length).toBe(before + 1);
        });

        it('should not import duplicate IDs', () => {
            const existing = svc.getSkills()[0];
            const imported = svc.importSkills(JSON.stringify([existing]));
            expect(imported).toBe(0);
        });

        it('should throw on invalid JSON', () => {
            expect(() => svc.importSkills('not json')).toThrow();
        });
    });

    describe('destroy', () => {
        it('should clear skills', async () => {
            deps.skillsStore.count = vi.fn().mockResolvedValue(0);
            await svc.init();
            svc.destroy();
            expect(svc.getSkills().length).toBe(0);
        });
    });
});
