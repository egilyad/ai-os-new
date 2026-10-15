import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import DebateStrategyBuilder from './DebateStrategyBuilder';

const registry = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        strategyRegistry: {
            list: () => [],
            validate: () => ({ valid: true, errors: [], warnings: [] }),
            register: (...args: unknown[]) =>
                (registry.register as (...a: unknown[]) => void)(...args),
            get: vi.fn(() => undefined),
        },
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('DebateStrategyBuilder Deploy (Zone 2)', () => {
    it('registers the strategy instead of only toasting', () => {
        render(<DebateStrategyBuilder />);
        fireEvent.change(screen.getByPlaceholderText('Strategy name'), {
            target: { value: 'My Strategy' },
        });
        fireEvent.click(screen.getByText('Deploy'));
        expect(registry.register).toHaveBeenCalledTimes(1);
    });
});
