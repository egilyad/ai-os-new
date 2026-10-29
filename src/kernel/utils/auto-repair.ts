export interface AutoRepairOptions<T> {
    run: () => Promise<T>;
    snapshot: () => unknown;
    restore: (snapshot: unknown) => Promise<void>;
    maxAttempts?: number;
}

export interface AutoRepairResult<T> {
    ok: boolean;
    value?: T;
    attempts: number;
    restored: number;
    error?: unknown;
}

/**
 * P3-4: auto-repair with rollback. Takes a snapshot, runs the operation, and
 * if it fails, restores the snapshot and retries up to `maxAttempts`. Non-zero
 * `restored` reports how many rollbacks happened.
 */
export async function withAutoRepair<T>(
    options: AutoRepairOptions<T>,
): Promise<AutoRepairResult<T>> {
    const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    const initialSnapshot = options.snapshot();
    let attempts = 0;
    let restored = 0;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const value = await options.run();
            return { ok: true, value, attempts, restored };
        } catch (error) {
            if (attempts >= maxAttempts) {
                return { ok: false, attempts, restored, error };
            }
            await options.restore(initialSnapshot);
            restored++;
        }
    }

    return { ok: false, attempts, restored };
}
