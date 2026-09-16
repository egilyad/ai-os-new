export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
    cancel(): void;
    flush(): void;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number,
    leading?: boolean,
): DebouncedFn<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let leadingFired = false;

    const debounced = (...args: Parameters<T>) => {
        lastArgs = args;
        if (timer) clearTimeout(timer);
        if (leading && !leadingFired) {
            leadingFired = true;
            fn(...args);
        }
        timer = setTimeout(() => {
            timer = null;
            leadingFired = false;
            if (lastArgs) fn(...lastArgs);
            lastArgs = null;
        }, ms);
    };

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        lastArgs = null;
        leadingFired = false;
    };

    debounced.flush = () => {
        if (timer && lastArgs) {
            clearTimeout(timer);
            timer = null;
            const args = lastArgs;
            lastArgs = null;
            fn(...args);
        }
    };

    return debounced;
}

export interface ThrottledFn<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
    cancel(): void;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number,
): ThrottledFn<T> {
    let last = 0;
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    const throttled = (...args: Parameters<T>) => {
        const now = Date.now();
        lastArgs = args;
        if (now - last >= ms) {
            last = now;
            trailingTimer = null;
            fn(...args);
        } else if (!trailingTimer) {
            trailingTimer = setTimeout(
                () => {
                    last = Date.now();
                    trailingTimer = null;
                    if (lastArgs) fn(...lastArgs);
                },
                ms - (now - last),
            );
        }
    };

    throttled.cancel = () => {
        if (trailingTimer) clearTimeout(trailingTimer);
        trailingTimer = null;
        lastArgs = null;
        last = 0;
    };

    return throttled;
}
