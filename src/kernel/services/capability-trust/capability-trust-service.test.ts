import { describe, it, expect, vi } from 'vitest';
import { CapabilityTrustService } from './capability-trust-service';

describe('CapabilityTrustService', () => {
    it('starts at declared and never moves backwards', () => {
        const service = new CapabilityTrustService();
        service.declare('panel:memory', 'panel', 'memory', ['wiki']);
        expect(service.get('panel:memory')?.trust).toBe('declared');

        service.discover('panel:memory', 'panel', 'memory', ['src/components/MemoryPanel']);
        expect(service.get('panel:memory')?.trust).toBe('discovered');

        // A later "declare" must not downgrade what the code already proved.
        service.declare('panel:memory', 'panel', 'memory');
        expect(service.get('panel:memory')?.trust).toBe('discovered');
    });

    it('promotes to verified and counts verifications', () => {
        const service = new CapabilityTrustService();
        service.discover('action:ui.openPanel', 'action', 'ui.openPanel');
        const record = service.verify('action:ui.openPanel', 'action', 'ui.openPanel', [
            'route: /memory',
        ]);

        expect(record.trust).toBe('verified');
        expect(record.verifications).toBe(1);
        expect(record.evidence).toContain('route: /memory');

        service.verify('action:ui.openPanel', 'action', 'ui.openPanel', ['route: /agents']);
        expect(service.get('action:ui.openPanel')?.verifications).toBe(2);
        expect(service.get('action:ui.openPanel')?.evidence).toContain('route: /agents');
    });

    it('marks a verified capability as stale without dropping the trust level', () => {
        const service = new CapabilityTrustService();
        service.verify('action:agents.spawn', 'action', 'agents.spawn', ['agentId: a1']);
        service.markStale('action:agents.spawn', 'topology is not mounted');

        const record = service.get('action:agents.spawn');
        expect(record?.stale).toBe(true);
        expect(record?.trust).toBe('verified');
        expect(record?.evidence.join(' ')).toContain('stale: topology is not mounted');
    });

    it('filters by kind, trust and staleness', () => {
        const service = new CapabilityTrustService();
        service.declare('panel:memory', 'panel', 'memory');
        service.discover('action:agents.list', 'action', 'agents.list');
        service.verify('action:ui.openPanel', 'action', 'ui.openPanel', ['route: /memory']);
        service.markStale('action:ui.openPanel', 'router changed');

        expect(service.list({ kind: 'action' }).map((r) => r.id)).toEqual([
            'action:agents.list',
        ]);
        expect(service.list({ trust: 'declared' }).map((r) => r.id)).toEqual(['panel:memory']);
        expect(service.list({ includeStale: true })).toHaveLength(3);
    });

    it('seeds many discovered capabilities at once', () => {
        const service = new CapabilityTrustService();
        const added = service.seed([
            { id: 'panel:a', kind: 'panel', title: 'a', evidence: ['/a'] },
            { id: 'panel:b', kind: 'panel', title: 'b' },
        ]);

        expect(added).toBe(2);
        expect(service.get('panel:a')?.trust).toBe('discovered');
        expect(service.stats()).toMatchObject({ total: 2, discovered: 2, verified: 0 });

        // Seeding again does not duplicate or downgrade.
        const again = service.seed([{ id: 'panel:a', kind: 'panel', title: 'a' }]);
        expect(again).toBe(0);
        expect(service.get('panel:a')?.evidence).toContain('/a');
    });

    it('reports stats and a prompt-ready summary', () => {
        const service = new CapabilityTrustService();
        service.declare('a', 'feature', 'a');
        service.discover('b', 'feature', 'b');
        service.verify('c', 'feature', 'c', ['ok']);

        expect(service.stats()).toEqual({
            total: 3,
            declared: 1,
            discovered: 1,
            verified: 1,
            stale: 0,
        });
        expect(service.summary()).toContain('verified 1');
    });

    it('emits a change event', () => {
        const eventBus = { emit: vi.fn() };
        const service = new CapabilityTrustService({ eventBus: eventBus as never });
        service.declare('panel:x', 'panel', 'x');
        expect(eventBus.emit).toHaveBeenCalledWith('capability:trust:changed', {
            id: 'panel:x',
            kind: 'panel',
            trust: 'declared',
            stale: false,
        });
    });
});
