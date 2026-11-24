import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) =>
            ({
                'onboarding.dashboard_get_started_title': 'Get started',
                'onboarding.dashboard_get_started_body': 'Add a key or try demo',
                'onboarding.dashboard_explore': 'Explore',
                'onboarding.dashboard_add_key': 'Add key',
                'onboarding.dashboard_try_demo': 'Try demo',
            })[key] ?? key,
    }),
}));

import GetStartedPanel from './GetStartedPanel';

describe('GetStartedPanel demo', () => {
    it('включает демо и уходит в чат', () => {
        const onEnableDemo = vi.fn();
        const onNavigate = vi.fn();
        render(<GetStartedPanel show onNavigate={onNavigate} onEnableDemo={onEnableDemo} />);

        fireEvent.click(screen.getByText('Try demo'));
        expect(onEnableDemo).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledWith('chat');
    });
});
