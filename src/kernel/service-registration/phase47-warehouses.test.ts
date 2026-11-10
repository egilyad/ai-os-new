import '../../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from '../runtime';
import { LENS_LIBRARY } from '../services/lens-engine/lens-library';
import { TopologyTemplateService } from '../services/topology-template-service';

describe('Phase47 warehouses (U)', () => {
    it('ships builtin roles', async () => {
        const roles = runtime.getService<{ getAllRoles(): Array<{ name: string }> }>('roleService');
        await vi.waitFor(
            async () => {
                expect(roles.getAllRoles().length).toBeGreaterThan(0);
            },
            { timeout: 10000 },
        );
    });

    it('registers the lens library', () => {
        expect(LENS_LIBRARY.length).toBeGreaterThan(10);
        const ids = new Set(LENS_LIBRARY.map((l) => l.id));
        expect(ids.has('lens:critical')).toBe(true);
        expect(ids.has('lens:legal-risk')).toBe(true);
    });

    it('registers builtin topology templates', () => {
        const svc = new TopologyTemplateService();
        for (const id of ['simple-chat', 'research-team', 'code-review', 'debate-panel']) {
            const tpl = svc.getTemplate(id);
            expect(tpl, id).toBeDefined();
            expect(tpl!.nodes.length).toBeGreaterThan(0);
            expect(tpl!.edges.length).toBeGreaterThan(0);
        }
    });
});
