import '../../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from '../runtime';
import type { ISkillMarketService } from '../contracts/ops';
import { getCrewTemplate } from '../services/crew/crew-templates';

function market(): ISkillMarketService {
    return runtime.getService<ISkillMarketService>('skillMarketService');
}

describe('Phase45 warehouse seeds (S)', () => {
    it('seeds builtin skills (Repo Guide, Summarizer, …)', async () => {
        await vi.waitFor(
            async () => {
                const names = (await market().list()).map((s) => s.name);
                expect(names.length).toBeGreaterThan(0);
                expect(names).toContain('Repo Guide');
                expect(names).toContain('Summarizer');
            },
            { timeout: 10000 },
        );
    });

    it('registers crew templates with buildable crews', () => {
        for (const id of ['research-team', 'code-review-council', 'content-forge']) {
            const tpl = getCrewTemplate(id);
            expect(tpl).toBeDefined();
            const built = tpl!.build();
            expect((built.roles ?? []).length).toBeGreaterThan(0);
            expect((built.tasks ?? []).length).toBeGreaterThan(0);
        }
    });

    it('ships builtin roles', async () => {
        const roles = runtime.getService<{ getAllRoles(): Array<{ name: string }> }>('roleService');
        await vi.waitFor(
            async () => {
                const names = roles.getAllRoles().map((r) => r.name);
                expect(names).toEqual(
                    expect.arrayContaining(['System Architect', 'Security Engineer', 'Data Scientist']),
                );
            },
            { timeout: 10000 },
        );
    });
});
