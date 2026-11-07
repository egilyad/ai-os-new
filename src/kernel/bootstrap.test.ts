import { describe, it, expect, vi } from 'vitest';
import { Container } from './container';
import { SystemBootstrap } from './bootstrap';

function makeBus() {
    return {
        emit: vi.fn(),
        emitOnce: vi.fn(),
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
        clearAllSubscriptions: vi.fn(),
    };
}

describe('SystemBootstrap', () => {
    it('starts in pending phase and reports status', () => {
        const container = new Container();
        const boot = new SystemBootstrap(container, makeBus() as never);
        expect(boot.getPhase()).toBe('pending');
        expect(boot.isReady()).toBe(false);
        const report = boot.getReport();
        expect(report.phase).toBe('pending');
        expect(report.services).toEqual([]);
    });

    it('registers container and logger for resolution', () => {
        const container = new Container();
        const boot = new SystemBootstrap(container, makeBus() as never);
        expect(boot.resolve<Container>('container')).toBe(container);
        expect(boot.resolve('logger')).toBeDefined();
    });
});
