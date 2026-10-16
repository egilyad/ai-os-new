import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

vi.mock('../../kernel/instances', () => ({
    policyService: {
        getPolicies: vi.fn().mockReturnValue([]),
        createPolicy: vi.fn().mockReturnValue({ id: 'p1' }),
        updatePolicy: vi.fn().mockReturnValue(undefined),
        deletePolicy: vi.fn().mockReturnValue(undefined),
        evaluate: vi.fn().mockReturnValue({ allowed: true }),
        getPatterns: vi.fn().mockReturnValue([]),
        getViolations: vi.fn().mockReturnValue([]),
        getStats: vi.fn().mockReturnValue({ total: 0, active: 0, violations: 0 }),
    },
    rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}));

vi.mock('../../hooks/useAutoClearError', () => ({
    // The component uses the return value as a callable clearError().
    useAutoClearError: () => vi.fn(),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('framer-motion', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    motion: { div: (props: any) => <div {...props} /> },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AnimatePresence: (props: any) => <div>{props.children}</div>,
}));

vi.mock('../ModalShell', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ModalShell: (props: any) => <div>{props.children}</div>,
}));

describe('PolicyPanel (smoke)', () => {
    it('renders without crashing', async () => {
        const { default: PolicyPanel } = await import('./PolicyPanel');
        render(<PolicyPanel />);
        expect(await screen.findByText('policy.title')).toBeDefined();
    });

    it('shows a fetch error instead of crashing the mount', async () => {
        const { policyService } = await import('../../kernel/instances');
        vi.mocked(policyService.getPolicies).mockImplementationOnce(() => {
            throw new Error('store down');
        });
        const { default: PolicyPanel } = await import('./PolicyPanel');
        render(<PolicyPanel />);
        expect(await screen.findByText('policy.error_fetch')).toBeDefined();
    });

    it('search tolerates legacy policies without type or id', async () => {
        const { policyService } = await import('../../kernel/instances');
        vi.mocked(policyService.getPolicies).mockReturnValueOnce([
            { value: 1 } as never,
        ]);
        const { default: PolicyPanel } = await import('./PolicyPanel');
        render(<PolicyPanel />);
        expect(await screen.findByText('policy.title')).toBeDefined();
        fireEvent.change(screen.getByPlaceholderText('policy.search_placeholder'), {
            target: { value: 'zzz' },
        });
        expect(await screen.findByText('policy.empty_search')).toBeDefined();
    });
});
