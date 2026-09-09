import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !ref.current) return;

        const container = ref.current;
        const previouslyFocused = document.activeElement as HTMLElement | null;

        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        firstFocusable?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (!firstFocusable || !lastFocusable) return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [active]);

    return ref;
}
