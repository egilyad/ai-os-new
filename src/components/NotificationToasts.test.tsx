import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const handlers = vi.hoisted(() => new Set<(data?: unknown) => void>());

vi.mock('../kernel/instances/events', () => ({
    EVENTS: { NOTIFICATION: 'system:notification' },
    eventBus: {
        on: (event: string, cb: (data?: unknown) => void) => {
            if (event === 'system:notification') handlers.add(cb);
            return () => {
                handlers.delete(cb);
            };
        },
    },
}));

import NotificationToasts from './NotificationToasts';

function emit(data: unknown) {
    handlers.forEach((cb) => cb(data));
}

describe('NotificationToasts', () => {
    beforeEach(() => {
        handlers.clear();
    });

    it('показывает уведомление из system:notification', () => {
        render(<NotificationToasts />);
        expect(screen.queryByText('debate finished')).toBeNull();
        act(() => emit({ message: 'debate finished', type: 'success' }));
        expect(screen.getByText('debate finished')).toBeTruthy();
    });

    it('уведомление можно закрыть вручную', () => {
        render(<NotificationToasts />);
        act(() => emit({ message: 'close me', type: 'info' }));
        fireEvent.click(screen.getByLabelText('Dismiss notification'));
        expect(screen.queryByText('close me')).toBeNull();
    });

    it('игнорирует невалидные события', () => {
        render(<NotificationToasts />);
        act(() => emit({ type: 'error' }));
        act(() => emit(undefined));
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('не показывает тосты в скрытой вкладке', () => {
        const original = Object.getOwnPropertyDescriptor(document, 'hidden');
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        try {
            render(<NotificationToasts />);
            act(() => emit({ message: 'hidden tab', type: 'info' }));
            expect(screen.queryByText('hidden tab')).toBeNull();
        } finally {
            if (original) Object.defineProperty(document, 'hidden', original);
        }
    });
});
