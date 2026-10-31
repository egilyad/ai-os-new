import { describe, it, expect } from 'vitest';
import { withAutoRepair } from './auto-repair';

describe('withAutoRepair (P3-4)', () => {
    it('recovers from transient failures by restoring and retrying', async () => {
        let attempts = 0;
        let restores = 0;
        const result = await withAutoRepair({
            run: async () => {
                attempts++;
                if (attempts < 3) throw new Error('transient');
                return 'ok';
            },
            snapshot: () => 1,
            restore: async () => {
                restores++;
            },
        });
        expect(result.ok).toBe(true);
        expect(result.value).toBe('ok');
        expect(result.attempts).toBe(3);
        expect(result.restored).toBe(2);
        expect(restores).toBe(2);
    });

    it('fails after exhausting attempts', async () => {
        const result = await withAutoRepair({
            run: async () => {
                throw new Error('always fails');
            },
            snapshot: () => 0,
            restore: async () => {},
            maxAttempts: 4,
        });
        expect(result.ok).toBe(false);
        expect(result.attempts).toBe(4);
        expect(result.restored).toBe(3);
        expect(result.error).toBeInstanceOf(Error);
    });
});
