import { useEffect, useRef } from 'react';

/**
 * C-95: Polling hook that auto-pauses when the browser tab is hidden.
 * Clears interval when hidden, restarts when visible.
 * @param callback — the function to call on each tick (stable reference preferred)
 * @param intervalMs — polling interval in milliseconds
 * @param enabled — optionally disable polling entirely (default true)
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true): void {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (!enabled || intervalMs <= 0) return;

        const tick = () => {
            savedCallback.current();
        };

        let id: ReturnType<typeof setInterval> | null = null;

        function start() {
            if (id !== null) clearInterval(id);
            id = setInterval(tick, intervalMs);
        }

        function stop() {
            if (id !== null) {
                clearInterval(id);
                id = null;
            }
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'visible') {
                start();
            } else {
                stop();
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange);
        if (document.visibilityState === 'visible') {
            tick();
            start();
        }

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [intervalMs, enabled]);
}
