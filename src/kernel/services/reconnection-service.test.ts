import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReconnectionService } from './reconnection-service';
import type { ReconnectionConfig } from './reconnection-service';

describe('ReconnectionService', () => {
    let svc: ReconnectionService;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValue(0);
        svc = new ReconnectionService();
    });

    afterEach(() => {
        svc.destroy();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    function makeConfig(overrides?: Partial<ReconnectionConfig>): ReconnectionConfig {
        return {
            streamId: 'stream-1',
            provider: 'groq',
            model: 'llama-3',
            maxRetries: 3,
            baseDelayMs: 100,
            maxDelayMs: 5000,
            lastIndex: 0,
            lastMessages: [],
            onReconnect: vi.fn().mockResolvedValue(true),
            onGiveUp: vi.fn(),
            ...overrides,
        };
    }

    describe('register', () => {
        it('should schedule first retry on register', async () => {
            const config = makeConfig();
            svc.register(config);
            expect(config.onReconnect).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(110);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
        });

        it('should replace existing stream registration', () => {
            const c1 = makeConfig({ streamId: 's1', onGiveUp: vi.fn() });
            const c2 = makeConfig({
                streamId: 's1',
                onReconnect: vi.fn().mockResolvedValue(true),
                onGiveUp: vi.fn(),
            });
            svc.register(c1);
            svc.register(c2);
            vi.advanceTimersByTime(5000);
            // c1's onGiveUp should not be called (c1 was replaced)
            expect(c1.onGiveUp).not.toHaveBeenCalled();
        });

        it('should respect maxRetries and call onGiveUp', async () => {
            const config = makeConfig({
                maxRetries: 2,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(110);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(210);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(410);
            expect(config.onGiveUp).toHaveBeenCalledWith('stream-1', 'groq');
        });

        it('should use exponential backoff', async () => {
            const config = makeConfig({
                maxRetries: 3,
                baseDelayMs: 1000,
                maxDelayMs: 10000,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(1100);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(2100);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(4100);
            expect(config.onReconnect).toHaveBeenCalledTimes(3);
        });

        it('should cap delay at maxDelayMs', async () => {
            const config = makeConfig({
                maxRetries: 3,
                baseDelayMs: 5000,
                maxDelayMs: 6000,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(5100);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(6100);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
        });

        it('should call onReconnect when successful', async () => {
            const config = makeConfig({ onReconnect: vi.fn().mockResolvedValue(true) });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(110);
            expect(config.onReconnect).toHaveBeenCalledWith('stream-1', 'groq');
        });

        it('should replace existing stream registration', () => {
            const c1 = makeConfig({ streamId: 's1', onGiveUp: vi.fn() });
            const c2 = makeConfig({
                streamId: 's1',
                onReconnect: vi.fn().mockResolvedValue(true),
                onGiveUp: vi.fn(),
            });
            svc.register(c1);
            svc.register(c2);
            vi.advanceTimersByTime(5000);
            // c1's onGiveUp should not be called (c1 was replaced)
            expect(c1.onGiveUp).not.toHaveBeenCalled();
        });

        it('should respect maxRetries and call onGiveUp', async () => {
            const config = makeConfig({
                maxRetries: 2,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(110);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(210);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(410);
            expect(config.onGiveUp).toHaveBeenCalledWith('stream-1', 'groq');
        });

        it('should use exponential backoff', async () => {
            const config = makeConfig({
                maxRetries: 3,
                baseDelayMs: 1000,
                maxDelayMs: 10000,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(1100);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(2100);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(4100);
            expect(config.onReconnect).toHaveBeenCalledTimes(3);
        });

        it('should cap delay at maxDelayMs', async () => {
            const config = makeConfig({
                maxRetries: 3,
                baseDelayMs: 5000,
                maxDelayMs: 6000,
                onReconnect: vi.fn().mockResolvedValue(false),
            });
            svc.register(config);
            await vi.advanceTimersByTimeAsync(5100);
            expect(config.onReconnect).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(6100);
            expect(config.onReconnect).toHaveBeenCalledTimes(2);
        });

        it('should call onReconnect when successful', () => {
            const config = makeConfig({ onReconnect: vi.fn().mockResolvedValue(true) });
            svc.register(config);
            vi.advanceTimersByTime(110);
            expect(config.onReconnect).toHaveBeenCalledWith('stream-1', 'groq');
        });
    });

    describe('cancel', () => {
        it('should cancel a specific stream', () => {
            const config = makeConfig({ onGiveUp: vi.fn() });
            svc.register(config);
            svc.cancel('stream-1');
            vi.advanceTimersByTime(5000);
            expect(config.onReconnect).not.toHaveBeenCalled();
            expect(config.onGiveUp).not.toHaveBeenCalled();
        });

        it('should be no-op for unknown stream', () => {
            expect(() => svc.cancel('nonexistent')).not.toThrow();
        });
    });

    describe('cancelAll', () => {
        it('should cancel all streams', () => {
            const c1 = makeConfig({ streamId: 's1', onGiveUp: vi.fn() });
            const c2 = makeConfig({ streamId: 's2', onGiveUp: vi.fn() });
            svc.register(c1);
            svc.register(c2);
            svc.cancelAll();
            vi.advanceTimersByTime(5000);
            expect(c1.onReconnect).not.toHaveBeenCalled();
            expect(c2.onReconnect).not.toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should cancel all streams', () => {
            const config = makeConfig();
            svc.register(config);
            svc.destroy();
            vi.advanceTimersByTime(5000);
            expect(config.onReconnect).not.toHaveBeenCalled();
        });
    });
});
