import { useEffect, useRef } from 'react';

/**
 * C-95: Visibility-safe setInterval — pauses when the tab is hidden,
 * resumes when visible again. Prevents wasteful background polling.
 */
export function useVisibilityInterval(callback: () => void, delayMs: number): void {
    const savedCallback = useRef(callback);
    savedCallback.current = callback;

    useEffect(() => {
        if (delayMs <= 0) return;
        const tick = () => {
            if (document.visibilityState === 'visible') {
                savedCallback.current();
            }
        };
        const id = setInterval(tick, delayMs);
        return () => clearInterval(id);
    }, [delayMs]);
}
