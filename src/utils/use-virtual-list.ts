import { useEffect, useRef, useState } from 'react';

export interface UseVirtualListOptions {
    /** Total number of rows in the dataset. */
    count: number;
    /** Estimated row height in pixels. */
    rowHeight: number;
    /** Extra rows rendered above/below the viewport for smooth scrolling. */
    overscan?: number;
}

/**
 * P2-6: generic virtual-list hook. Given a row count and row height it returns
 * the visible range of indices plus a scroll container ref. Render only the
 * returned indices (absolutely positioned inside a `totalHeight` box) to keep
 * very long lists cheap regardless of dataset size.
 */
export function useVirtualList<T extends HTMLElement = HTMLDivElement>(
    options: UseVirtualListOptions,
) {
    const { count, rowHeight, overscan = 5 } = options;
    const containerRef = useRef<T | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewport, setViewport] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            setScrollTop(el.scrollTop);
            setViewport(el.clientHeight);
        };
        update();
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    const safeRowHeight = Math.max(1, rowHeight);
    const start = Math.max(0, Math.floor(scrollTop / safeRowHeight) - overscan);
    const end = Math.min(count, Math.ceil((scrollTop + viewport) / safeRowHeight) + overscan);
    const totalHeight = count * safeRowHeight;
    const offsetY = start * safeRowHeight;

    const items: number[] = [];
    for (let i = start; i < end; i++) items.push(i);

    return { containerRef, items, offsetY, totalHeight, start, end };
}
