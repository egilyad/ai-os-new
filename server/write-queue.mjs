/**
 * Serialized async work queue with a self-healing chain (C-6).
 *
 * Previously the shared chain was a bare `promise.then(...)` with no
 * trailing `.catch`: a single throw inside one unit (e.g. writeJson on an
 * already-closed socket) rejected the chain forever, and every later unit
 * was silently skipped — a permanent write blackout until process restart.
 *
 * Here the chain (`tail`) always continues via its own catch; the per-unit
 * promise (`run`) still settles as the unit did, so callers can observe
 * individual failures without wedging the queue.
 */

let tail = Promise.resolve();

export function enqueueDbWrite(fn) {
    const run = tail.then(() => fn());
    tail = run.catch((e) => {
        console.error('[write-queue] unit failed, chain continues', e);
    });
    return run;
}

/** Test-only: reset the chain between cases. */
export function __resetWriteQueueForTests() {
    tail = Promise.resolve();
}
