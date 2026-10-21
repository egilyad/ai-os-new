import { describe, it, expect } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import { CapabilityTrustService } from '../capability-trust/capability-trust-service';

describe('AssistantActionRegistry + trust ledger', () => {
    it('marks actions as discovered on registration and verified after a run', async () => {
        const trust = new CapabilityTrustService();
        const registry = new AssistantActionRegistry();
        registry.setTrustService(trust);

        registry.register({
            id: 'system.find',
            group: 'research',
            description: 'find',
            parameters: { type: 'object', properties: {} },
            action: 'tool:read',
            run: async () => ({ ok: true, detail: 'found', evidence: 'panel memory' }),
        });

        expect(trust.get('action:system.find')?.trust).toBe('discovered');

        const result = await registry.run('system.find', {});
        expect(result.ok).toBe(true);
        const record = trust.get('action:system.find');
        expect(record?.trust).toBe('verified');
        expect(record?.evidence).toContain('panel memory');
    });

    it('does not promote a failed action', async () => {
        const trust = new CapabilityTrustService();
        const registry = new AssistantActionRegistry();
        registry.setTrustService(trust);

        registry.register({
            id: 'agents.spawn',
            group: 'work',
            description: 'spawn',
            parameters: { type: 'object', properties: {} },
            action: 'tool:write',
            run: async () => ({ ok: false, detail: 'no active topology' }),
        });

        await registry.run('agents.spawn', {});
        expect(trust.get('action:agents.spawn')?.trust).toBe('discovered');
        expect(trust.get('action:agents.spawn')?.verifications).toBe(0);
    });

    it('tracks actions that were registered before the ledger was attached', async () => {
        const trust = new CapabilityTrustService();
        const registry = new AssistantActionRegistry();

        registry.register({
            id: 'ui.openPanel',
            group: 'navigation',
            description: 'open',
            parameters: { type: 'object', properties: {} },
            action: 'tool:read',
            run: async () => ({ ok: true, detail: 'opened', evidence: 'route: /memory' }),
        });

        registry.setTrustService(trust);
        expect(trust.get('action:ui.openPanel')?.trust).toBe('discovered');

        await registry.run('ui.openPanel', {});
        expect(trust.get('action:ui.openPanel')?.trust).toBe('verified');
    });
});
