import '../../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from '../runtime';
import type { ISkillMarketService } from '../contracts/ops';
import type { Role } from '../types/role-types';
import { getCrewTemplate } from '../services/crew/crew-templates';

function market(): ISkillMarketService {
    return runtime.getService<ISkillMarketService>('skillMarketService');
}

interface RoleReader {
    getRole(id: string): Role | undefined;
}

describe('Phase45 warehouse seeds (S)', () => {
    it('seeds the 4 Biz skills', async () => {
        for (const name of ['BizAnalyst', 'SDR', 'SEO Auditor', 'Finance Ops']) {
            await vi.waitFor(
                async () => {
                    expect((await market().list()).map((s) => s.name)).toContain(name);
                },
                { timeout: 10000 },
            );
        }
    });

    it('registers the 3 S-phase crew templates with buildable crews', () => {
        for (const id of ['seo-engine', 'outreach-factory', 'finance-desk']) {
            const tpl = getCrewTemplate(id);
            expect(tpl).toBeDefined();
            const built = tpl!.build();
            expect(built.roles.length).toBeGreaterThan(0);
            expect(built.tasks.length).toBeGreaterThan(0);
        }
    });

    it('ships the discussion-collective builtin roles', async () => {
        const roles = runtime.getService<RoleReader>('roleService');
        await vi.waitFor(
            () => {
                expect(roles.getRole('r-idea-generator')?.name).toBe('Генератор идей');
                expect(roles.getRole('r-moderator')?.name).toBe('Модератор');
                expect(roles.getRole('r-engineer')?.name).toBe('Инженер');
            },
            { timeout: 10000 },
        );
    });
});
