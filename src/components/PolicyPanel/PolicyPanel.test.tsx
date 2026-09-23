import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

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
    useAutoClearError: () => ({ error: null, setError: vi.fn(), clearError: vi.fn() }),
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
});
