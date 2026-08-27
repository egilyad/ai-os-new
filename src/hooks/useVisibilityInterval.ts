import { useEffect, useRef } from 'react';

/**
 * C-95: setInterval variant that respects document.visibilityState.
 * Pauses when the tab is hidden, resumes (and optionally fires immediately)
 * when the tab becomes visible again.
 */
export function useVisibilityInterval(
    callback: () => void,
    delayMs: number,
    options?: { immediateOnVisible?: boolean },
): void {
    const savedCallback = useRef(callback);
    const savedOptions = useRef(options);

    useEffect(() => {
        savedCallback.current = callback;
        savedOptions.current = options;
    }, [callback, options]);

    useEffect(() => {
        if (delayMs <= 0) return;

        let id: ReturnType<typeof setInterval> | null = null;

        function start() {
            if (id !== null) clearInterval(id);
            id = setInterval(() => savedCallback.current(), delayMs);
        }

        function stop() {
            if (id !== null) {
                clearInterval(id);
                id = null;
            }
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'visible') {
                if (savedOptions.current?.immediateOnVisible) {
                    savedCallback.current();
                }
                start();
            } else {
                stop();
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange);
        if (document.visibilityState === 'visible') start();

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [delayMs]);
}
