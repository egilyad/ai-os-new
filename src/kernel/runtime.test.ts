import { describe, it, expect, vi } from 'vitest';
import { RuntimeManager } from './runtime';

function makeManager() {
    const container = { clear: vi.fn(async () => {}) };
    const bootstrapper = {
        init: vi.fn(async () => {}),
        shutdown: vi.fn(async () => {}),
        getReport: vi.fn(() => ({ phase: 'ready', services: [], error: null })),
        resolve: vi.fn(),
    };
    const manager = new RuntimeManager(container as never, bootstrapper as never);
    return { manager, container, bootstrapper };
}

describe('RuntimeManager', () => {
    it('starts in loading phase and reports status', () => {
        const { manager } = makeManager();
        expect(manager.getPhase()).toBe('loading');
        expect(manager.getStatus().phase).toBe('loading');
        expect(manager.isReady()).toBe(false);
        expect(manager.getStatus().uptime).toBe(0);
    });

    it('markServiceReady does not exceed the total (0 before start)', () => {
        const { manager } = makeManager();
        manager.markServiceReady();
        manager.markServiceReady();
        expect(manager.getStatus().servicesReady).toBe(0);
    });
});
