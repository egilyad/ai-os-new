import { beforeEach, describe, expect, it } from 'vitest';
import { AgentPermissionService } from './permission-service';
import type { PermissionRule } from './permission-rules';

function createService() {
    const store = new Map<string, unknown>();
    const events: string[] = [];
    const service = new AgentPermissionService({
        eventBus: {
            emit: (event: string) => {
                events.push(event);
            },
            emitOnce: () => false,
        },
        database: {
            getKv: async <T>(id: string) => (store.get(id) as T) ?? null,
            setKv: async <T>(id: string, value: T) => {
                store.set(id, value);
            },
        },
    });
    return { service, store, events };
}

describe('AgentPermissionService', () => {
    let harness: ReturnType<typeof createService>;

    beforeEach(() => {
        harness = createService();
    });

    it('defaults to a guarded policy', () => {
        const state = harness.service.getState('agent-x');
        expect(state.mode).toBe('guarded');
        expect(state.preset).toBe('guarded');
        expect(state.rules).toEqual([]);
    });

    it('allows reads and asks before side effects in guarded mode', async () => {
        await harness.service.init();
        const read = await harness.service.evaluate('agent-x', 'tool:read', 't-read-file');
        const exec = await harness.service.evaluate('agent-x', 'tool:exec', 't-code');
        expect(read.effect).toBe('allow');
        expect(exec.effect).toBe('ask');
    });

    it('switches mode and keeps the preset in sync', async () => {
        await harness.service.init();
        await harness.service.setMode('agent-x', 'read-only');
        const state = harness.service.getState('agent-x');
        expect(state.mode).toBe('read-only');
        expect(state.preset).toBe('read-only');
        const exec = await harness.service.evaluate('agent-x', 'tool:exec', 't-code');
        expect(exec.effect).toBe('deny');
    });

    it('lets agent rules override the preset', async () => {
        await harness.service.init();
        const rule: PermissionRule = { action: 'tool:exec', resource: 't-code', effect: 'allow' };
        await harness.service.setRules('agent-x', [rule]);
        const decision = await harness.service.evaluate('agent-x', 'tool:exec', 't-code');
        expect(decision.effect).toBe('allow');
    });

    it('escalates repeated denials into a hard stop', async () => {
        await harness.service.init();
        const threshold = AgentPermissionService.DENIAL_ESCALATION_THRESHOLD;
        for (let i = 0; i < threshold; i++) {
            await harness.service.recordDenial('agent-x');
        }
        const decision = await harness.service.evaluate('agent-x', 'tool:exec', 't-code');
        expect(decision.effect).toBe('deny');
        expect(decision.escalated).toBe(true);
    });

    it('clears the denial counter after an approval', async () => {
        await harness.service.init();
        await harness.service.recordDenial('agent-x');
        await harness.service.resetDenials('agent-x');
        expect(harness.service.getState('agent-x').consecutiveDenials).toBe(0);
    });

    it('persists state and saved rules', async () => {
        await harness.service.init();
        await harness.service.setRules('agent-x', [
            { action: 'tool:net', resource: 't-web', effect: 'allow' },
        ]);
        await harness.service.addSavedRule({
            action: 'tool:mcp',
            resource: '*',
            effect: 'allow',
        });

        const reloaded = createService();
        reloaded.store.set('super_agents_agent_permissions', harness.store.get('super_agents_agent_permissions'));
        reloaded.store.set('super_agents_permission_saved', harness.store.get('super_agents_permission_saved'));
        await reloaded.service.init();

        expect(reloaded.service.getState('agent-x').rules).toHaveLength(1);
        expect(reloaded.service.getSavedRules()).toHaveLength(1);
        const decision = await reloaded.service.evaluate('agent-x', 'tool:net', 't-web');
        expect(decision.effect).toBe('allow');
    });

    it('emits a decision event for every evaluation', async () => {
        await harness.service.init();
        await harness.service.evaluate('agent-x', 'tool:read', 't-read-file');
        expect(harness.events).toContain('permission:decided');
    });
});
