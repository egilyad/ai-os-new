import { describe, it, expect } from 'vitest';
import { SkillService, createMemorySkillStore } from './skill-service';

describe('SkillService (P2-1)', () => {
    it('records, lists, searches and marks used', async () => {
        const svc = new SkillService(createMemorySkillStore());
        await svc.init();
        const s = await svc.record({
            name: 'Debug vitest',
            description: 'run tests',
            steps: ['npx vitest run'],
            tags: ['testing'],
        });
        expect(svc.list()).toHaveLength(1);
        expect(svc.search('testing').map((x) => x.id)).toContain(s.id);
        await svc.markUsed(s.id);
        expect(svc.get(s.id)?.useCount).toBe(1);
        await svc.remove(s.id);
        expect(svc.list()).toHaveLength(0);
    });

    it('persists through the store', async () => {
        const store = createMemorySkillStore();
        const svc = new SkillService(store);
        await svc.init();
        await svc.record({ name: 'X', description: 'd', steps: ['a'] });
        const svc2 = new SkillService(store);
        await svc2.init();
        expect(svc2.list()).toHaveLength(1);
    });
});
