import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GuardrailRule } from '../../kernel/contracts/rivals';

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

let store: GuardrailRule[] = [];

vi.mock('../../kernel/instances/services-extras', () => ({
    guardrailService: {
        listRules: vi.fn(async () => [...store]),
        addRule: vi.fn(async (input: { name: string; kind: GuardrailRule['kind']; pattern?: string; value?: number; tripwire?: 'block' | 'flag' }) => {
            const rule: GuardrailRule = {
                id: `rule-${store.length + 1}`,
                name: input.name,
                kind: input.kind,
                pattern: input.pattern,
                value: input.value,
                tripwire: input.tripwire ?? 'block',
                createdAt: Date.now(),
            };
            store.push(rule);
            return rule;
        }),
        removeRule: vi.fn(async (id: string) => {
            store = store.filter((r) => r.id !== id);
        }),
        check: vi.fn(async (text: string) => {
            const hits = store.filter((r) => r.pattern && text.includes(r.pattern)).map((r) => r.name);
            return { ok: hits.length === 0, hits };
        }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
    store = [
        { id: 'rule-1', name: 'NoSecrets', kind: 'contains', pattern: 'sk-', tripwire: 'block', createdAt: 1 },
    ];
    vi.clearAllMocks();
});

describe('GuardrailsPanel', () => {
    it('lists rules on mount', async () => {
        const { guardrailService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./GuardrailsPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(guardrailService.listRules).toHaveBeenCalled());
        expect(await screen.findByText('NoSecrets')).toBeDefined();
    });

    it('adds a rule and reloads the list', async () => {
        const { guardrailService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./GuardrailsPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('guardrails.namePlaceholder'), {
            target: { value: 'NoLeak' },
        });
        fireEvent.change(screen.getByPlaceholderText('guardrails.patternPlaceholder'), {
            target: { value: 'secret' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'guardrails.add.submit' }));
        await waitFor(() => expect(guardrailService.addRule).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'NoLeak', kind: 'contains', pattern: 'secret' }),
        ));
        expect(await screen.findByText('NoLeak')).toBeDefined();
    });

    it('removes a rule', async () => {
        const { guardrailService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./GuardrailsPanel')).default;
        render(<Panel />);
        await screen.findByText('NoSecrets');
        fireEvent.click(screen.getByRole('button', { name: 'guardrails.remove' }));
        await waitFor(() => expect(guardrailService.removeRule).toHaveBeenCalledWith('rule-1'));
        await waitFor(() => expect(screen.queryByText('NoSecrets')).toBeNull());
    });

    it('live-checks text and shows the verdict', async () => {
        const Panel = (await import('./GuardrailsPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('guardrails.probePlaceholder'), {
            target: { value: 'here is sk-abc' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'guardrails.check.submit' }));
        expect(await screen.findByText('guardrails.verdict.blocked')).toBeDefined();
        expect((await screen.findAllByText('NoSecrets')).length).toBeGreaterThan(0);
    });

    it('shows validation on empty rule name', async () => {
        const Panel = (await import('./GuardrailsPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: 'guardrails.add.submit' }));
        expect(await screen.findByText('guardrails.validation.rule')).toBeDefined();
    });
});
