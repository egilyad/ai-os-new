import '../../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from '../runtime';
import type { Role } from '../types/role-types';
import { LENS_LIBRARY } from '../services/lens-engine/lens-library';
import { TopologyTemplateService } from '../services/topology-template-service';

interface RoleReader {
    getRole(id: string): Role | undefined;
}

describe('Phase47 warehouses (U)', () => {
    it('ships the science-wing builtin roles', async () => {
        const roles = runtime.getService<RoleReader>('roleService');
        const expected: Array<[string, string]> = [
            ['r-mathematician', 'Математик'],
            ['r-physicist', 'Физик'],
            ['r-chemist', 'Химик'],
            ['r-lawyer', 'Юрист'],
            ['r-statistician', 'Статистик'],
            ['r-economist', 'Экономист'],
        ];
        await vi.waitFor(
            () => {
                for (const [id, name] of expected) {
                    expect(roles.getRole(id)?.name).toBe(name);
                }
            },
            { timeout: 10000 },
        );
    });

    it('registers the 2 RU-school lenses', () => {
        const ids = new Set(LENS_LIBRARY.map((l) => l.id));
        expect(ids.has('lens:ukhtomsky-dominanta')).toBe(true);
        expect(ids.has('lens:bernstein-levels')).toBe(true);
    });

    it('registers the 3 RU market topology templates', () => {
        const svc = new TopologyTemplateService();
        for (const id of ['local-ollama-triple', 'chemist-lab', 'ru-market-pack']) {
            const tpl = svc.getTemplate(id);
            expect(tpl).toBeDefined();
            expect(tpl!.nodes.length).toBeGreaterThan(0);
            expect(tpl!.edges.length).toBeGreaterThan(0);
        }
    });
});
