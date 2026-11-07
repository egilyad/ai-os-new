import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillMarketService } from './skill-market-service';
import type { SkillManifest } from '../../types/ops-types';

function makeRepo(initial: SkillManifest[] = []) {
    const skills = new Map<string, SkillManifest>(initial.map((s) => [s.id, s]));
    return {
        skills,
        putSkill: vi.fn(async (s: SkillManifest) => {
            skills.set(s.id, s);
        }),
        getSkill: vi.fn(async (id: string) => skills.get(id) ?? null),
        listSkills: vi.fn(async () => [...skills.values()]),
    };
}

function makeDeps(initial: SkillManifest[] = []) {
    const repo = makeRepo(initial);
    const audit = { append: vi.fn(async () => ({})) };
    const svc = new SkillMarketService(repo as never, audit as never);
    return { svc, repo, audit };
}

function manifest(id: string, partial: Partial<SkillManifest> = {}): SkillManifest {
    return {
        id,
        name: `skill-${id}`,
        version: '1.0.0',
        description: 'test',
        permissions: [],
        entry: 'index.ts',
        installed: false,
        createdAt: 0,
        updatedAt: 0,
        ...partial,
    };
}

describe('SkillMarketService', () => {
    beforeEach(() => {
        SkillMarketService.cache.clear();
    });

    it('publish stores a manifest and audits', async () => {
        const { svc, repo, audit } = makeDeps();
        const m = await svc.publish({ name: 'x', version: '1.0.0', description: 'd' });
        expect(repo.skills.has(m.id)).toBe(true);
        expect(audit.append).toHaveBeenCalledWith(
            'skills',
            'skill.published',
            m.id,
            'x@1.0.0',
        );
    });

    it('list returns all manifests and fills the export cache', async () => {
        const { svc } = makeDeps([manifest('s1')]);
        const all = await svc.list();
        expect(all).toHaveLength(1);
        expect(() => svc.exportManifest('s1')).not.toThrow();
    });

    it('install/uninstall toggle installed flag and audit', async () => {
        const { svc, audit } = makeDeps([manifest('s1')]);
        const installed = await svc.install('s1');
        expect(installed.installed).toBe(true);
        expect(audit.append).toHaveBeenCalledWith('skills', 'skill.installed', 's1', expect.any(String));
        const uninstalled = await svc.uninstall('s1');
        expect(uninstalled.installed).toBe(false);
    });

    it('exportManifest throws for unknown ids', async () => {
        const { svc } = makeDeps();
        expect(() => svc.exportManifest('missing')).toThrow(/not cached/);
    });
});
