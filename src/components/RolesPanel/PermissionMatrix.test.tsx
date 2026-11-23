import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Role } from '../../types/role';

vi.mock('framer-motion', () => {
    const motion = new Proxy(
        {},
        {
            get: (_target, prop: string) =>
                React.forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
                    React.createElement(prop, { ...props, ref }),
                ),
        },
    );
    return {
        motion,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    };
});

import { PermissionMatrix } from './PermissionMatrix';

const roles = [{ id: 'r1', name: 'Admin', permissions: [] }] as unknown as Role[];

describe('PermissionMatrix keyboard access', () => {
    it('переключает право по Enter и Space', () => {
        const onUpdate = vi.fn();
        render(<PermissionMatrix roles={roles} onUpdate={onUpdate} />);
        const cell = screen.getByRole('button', { name: 'Admin: chat:send' });
        expect(cell.getAttribute('aria-pressed')).toBe('false');
        fireEvent.keyDown(cell, { key: 'Enter' });
        expect(onUpdate).toHaveBeenCalledWith('r1', ['chat:send']);
    });

    it('переключает право по пробелу', () => {
        const onUpdate = vi.fn();
        render(<PermissionMatrix roles={roles} onUpdate={onUpdate} />);
        const cell = screen.getByRole('button', { name: 'Admin: chat:send' });
        fireEvent.keyDown(cell, { key: ' ' });
        expect(onUpdate).toHaveBeenCalledWith('r1', ['chat:send']);
    });
});
