import { describe, it, expect } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import {
    createAssistantAdminActions,
    type AssistantAdminDeps,
} from './assistant-admin-actions';

function deps(overrides: Partial<AssistantAdminDeps> = {}): AssistantAdminDeps {
    return {
        roles: {
            getAllRoles: () => [
                { id: 'architect', category: 'engineering', builtin: true },
                { id: 'reviewer', category: 'engineering', builtin: true },
                { id: 'my-role', category: 'custom', builtin: false },
            ],
        },
        settings: {
            getSettings: () => ({
                defaultMode: 'smart',
                slaMode: 'BALANCED',
                language: 'ru',
                theme: 'dark',
                streamingEnabled: true,
                fallbackEnabled: true,
                debugMode: false,
                chatDefaultProvider: 'openrouter',
                chatDefaultModel: 'claude-sonnet',
            }),
        },
        audit: {
            list: async (limit = 10) =>
                [
                    { actor: 'assistant', action: 'agents.spawn', target: 'researcher' },
                    { actor: 'operator', action: 'settings.update' },
                ].slice(0, limit),
            verify: async () => ({ ok: true }),
        },
        ...overrides,
    };
}

describe('assistant admin actions', () => {
    it('registers three safe reads', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps()));
        expect(registry.list().map((a) => a.id)).toEqual([
            'roles.list',
            'settings.get',
            'audit.recent',
        ]);
        for (const action of registry.list()) {
            expect(action.action).toBe('tool:read');
        }
    });

    it('counts roles by category and built-in split', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps()));
        const all = await registry.run('roles.list', {});
        expect(all.detail).toContain('3 role(s)');
        expect(all.detail).toContain('2 built-in');
        expect(all.evidence).toContain('engineering: 2');

        const custom = await registry.run('roles.list', { category: 'custom' });
        expect(custom.detail).toContain('1 role(s)');
        expect(custom.detail).toContain('1 custom');
    });

    it('reports settings without leaking secrets', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps()));
        const result = await registry.run('settings.get', {});
        expect(result.detail).toContain('mode smart');
        expect(result.detail).toContain('openrouter/claude-sonnet');
        expect(result.detail).toContain('debug: off');
        expect(JSON.stringify(result)).not.toMatch(/api[-_]?key|token|secret/i);
    });

    it('reads the audit tail and its chain state', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps()));
        const result = await registry.run('audit.recent', { limit: 1 });
        expect(result.detail).toContain('1 recent entry');
        expect(result.detail).toContain('chain intact');
        expect(result.evidence).toContain('agents.spawn');

        const broken = new AssistantActionRegistry();
        broken.registerAll(
            createAssistantAdminActions(
                deps({ audit: { list: async () => [], verify: async () => ({ ok: false, brokenAt: 7 }) } }),
            ),
        );
        const failed = await broken.run('audit.recent', {});
        expect(failed.detail).toContain('no audit entries');
        expect(failed.detail).toContain('broken at 7');
    });

    it('degrades honestly when a service is absent', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions({}));
        for (const id of ['roles.list', 'settings.get', 'audit.recent']) {
            const result = await registry.run(id, {});
            expect(result.ok).toBe(false);
            expect(result.verification).toBe('discovered');
        }
    });
});
