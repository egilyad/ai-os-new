import { describe, it, expect } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import {
    createAssistantAdminActions,
    type AssistantAdminDeps,
} from './assistant-admin-actions';

function settingsState() {
    const state = {
        defaultMode: 'smart' as string,
        slaMode: 'BALANCED' as string,
        language: 'ru' as string,
        theme: 'dark',
        streamingEnabled: true,
        fallbackEnabled: true,
        debugMode: false,
        historyPersistence: true,
        chatDefaultProvider: 'openrouter',
        chatDefaultModel: 'claude-sonnet',
    };
    return {
        state,
        settings: {
            getSettings: () => ({ ...state }),
            updateSettings: async (updates: Record<string, unknown>) => {
                Object.assign(state, updates);
            },
        },
    };
}

function deps(overrides: Partial<AssistantAdminDeps> = {}): AssistantAdminDeps {
    return {
        roles: {
            getAllRoles: () => [
                { id: 'architect', category: 'engineering', builtin: true },
                { id: 'reviewer', category: 'engineering', builtin: true },
                { id: 'my-role', category: 'custom', builtin: false },
            ],
        },
        settings: settingsState().settings,
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
    it('registers three safe reads and one guarded write', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps()));
        expect(registry.list().map((a) => a.id)).toEqual([
            'audit.recent',
            'roles.list',
            'settings.get',
            'settings.update',
        ]);
        expect(registry.get('settings.update')?.action).toBe('tool:write');
        for (const id of ['audit.recent', 'roles.list', 'settings.get']) {
            expect(registry.get(id)?.action).toBe('tool:read');
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

    it('changes an allowed setting and reads the new value back', async () => {
        const fixture = settingsState();
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps({ settings: fixture.settings })));
        const result = await registry.run('settings.update', { defaultMode: 'single' });
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('changed defaultMode');
        expect(result.evidence).toContain('smart → single');
        expect(fixture.state.defaultMode).toBe('single');
    });

    it('refuses unknown keys and values outside the allowed set', async () => {
        const fixture = settingsState();
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions(deps({ settings: fixture.settings })));

        const unknown = await registry.run('settings.update', { apiKey: 'sk-x' });
        expect(unknown.ok).toBe(false);
        expect(unknown.detail).toContain('refuses to change apiKey');

        const invalid = await registry.run('settings.update', { slaMode: 'TURBO' });
        expect(invalid.ok).toBe(false);
        expect(invalid.detail).toContain('slaMode=TURBO');

        expect(fixture.state.slaMode).toBe('BALANCED');
        expect(fixture.state.defaultMode).toBe('smart');
    });

    it('reports a read-only settings service instead of pretending', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantAdminActions({
                settings: { getSettings: () => ({ defaultMode: 'smart' }) },
            }),
        );
        const result = await registry.run('settings.update', { defaultMode: 'single' });
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('read-only');
    });

    it('degrades honestly when a service is absent', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantAdminActions({}));
        for (const id of ['roles.list', 'settings.get', 'audit.recent', 'settings.update']) {
            const result = await registry.run(id, {});
            expect(result.ok).toBe(false);
            expect(result.verification).toBe('discovered');
        }
    });
});
