import { describe, expect, it } from 'vitest';
import { MemoryWatchdog } from './memory-watchdog';

describe('MemoryWatchdog', () => {
    it('stop() is safe when never started', () => {
        const wd = new MemoryWatchdog({ intervalMs: 1000 });
        expect(() => wd.stop()).not.toThrow();
    });

    it('constructs with defaults', () => {
        const wd = new MemoryWatchdog();
        expect(wd).toBeInstanceOf(MemoryWatchdog);
    });

    it('start()/stop() round-trip without throwing', () => {
        const wd = new MemoryWatchdog({ intervalMs: 100000 });
        wd.start();
        wd.start(); // idempotent
        wd.stop();
        wd.stop();
    });

    it('onPressure registers a callback', () => {
        const wd = new MemoryWatchdog({ intervalMs: 100000 });
        let fired = false;
        wd.onPressure(() => {
            fired = true;
        });
        expect(fired).toBe(false);
    });
});
