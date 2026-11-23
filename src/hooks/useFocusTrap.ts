import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, onEscape?: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    const escapeRef = useRef(onEscape);

    useEffect(() => {
        escapeRef.current = onEscape;
    }, [onEscape]);

    useEffect(() => {
        if (!active || !ref.current) return;

        const container = ref.current;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const getFocusable = () =>
            Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

        const hadTabIndex = container.hasAttribute('tabindex');
        if (!hadTabIndex) container.setAttribute('tabindex', '-1');
        const initial = getFocusable();
        (initial[0] ?? container).focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && escapeRef.current) {
                e.preventDefault();
                escapeRef.current();
                return;
            }
            if (e.key !== 'Tab') return;
            const focusable = getFocusable();
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) {
                e.preventDefault();
                container.focus();
                return;
            }
            if (e.shiftKey) {
                if (
                    document.activeElement === first ||
                    !container.contains(document.activeElement)
                ) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (
                document.activeElement === last ||
                !container.contains(document.activeElement)
            ) {
                e.preventDefault();
                first.focus();
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            if (!hadTabIndex) container.removeAttribute('tabindex');
            previouslyFocused?.focus();
        };
    }, [active]);

    return ref;
}
