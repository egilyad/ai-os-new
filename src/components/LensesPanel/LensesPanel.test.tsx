import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Lens } from '../../kernel/types/lens-types';

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

const lensA: Lens = {
    id: 'lens-a',
    name: 'Critical Lens',
    description: 'Apply critical scrutiny',
    category: 'analytical',
    transform: { kind: 'prompt-prefix', text: 'critique:' },
    applicability: { taskTypes: [], domains: [] },
    compositionRules: { stackable: true, maxStackSize: 5, orderMatters: false, allowedWith: '*' },
    conflictWith: [],
    priority: 1,
    metadata: { version: 1, author: 'sys', tags: [], maturity: 'stable' },
};

const lensB: Lens = {
    id: 'lens-b',
    name: 'Ethical Lens',
    description: 'Apply ethical framing',
    category: 'ethical',
    transform: { kind: 'prompt-prefix', text: 'ethics:' },
    applicability: { taskTypes: [], domains: [] },
    compositionRules: { stackable: true, maxStackSize: 5, orderMatters: false, allowedWith: '*' },
    conflictWith: [],
    priority: 2,
    metadata: { version: 1, author: 'sys', tags: [], maturity: 'stable' },
};

const listLenses = vi.fn(() => [lensA, lensB]);
const validateStack = vi.fn(() => ({ valid: true, errors: [], resolvedOrder: [] }));
const suggestLenses = vi.fn(() => [{ lensId: 'lens-b', confidence: 0.8, rationale: 'good' }]);
const addLens = vi.fn();

vi.mock('../../kernel/instances', () => ({
    lensEngine: {
        listLenses,
        validateStack,
        suggestLenses,
        addLens,
        getLens: vi.fn(),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('LensesPanel (FT-01)', () => {
    it('renders the title, total count and the lens library', async () => {
        const LensesPanel = (await import('./LensesPanel')).default;
        render(<LensesPanel />);
        expect(await screen.findByText('lenses.title')).toBeDefined();
        expect(screen.getByText('2 lenses.total')).toBeDefined();
        expect(screen.getByText('Critical Lens')).toBeDefined();
        expect(screen.getByText('Ethical Lens')).toBeDefined();
        expect(listLenses).toHaveBeenCalled();
    });

    it('toggles a lens into the stack and validates it', async () => {
        const LensesPanel = (await import('./LensesPanel')).default;
        render(<LensesPanel />);
        await screen.findByText('Critical Lens');
        fireEvent.click(screen.getByText('Critical Lens'));
        expect(validateStack).toHaveBeenCalledWith(['lens-a']);
        expect(await screen.findByText('lenses.active_stack')).toBeDefined();
    });

    it('calls suggestLenses when the suggest button is clicked', async () => {
        const LensesPanel = (await import('./LensesPanel')).default;
        render(<LensesPanel />);
        await screen.findByText('lenses.title');
        fireEvent.click(screen.getByText('lenses.suggest'));
        expect(suggestLenses).toHaveBeenCalled();
        expect(await screen.findByText('lenses.suggestions')).toBeDefined();
    });
});
