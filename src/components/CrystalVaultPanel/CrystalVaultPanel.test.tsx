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

const list = vi.fn(() => Promise.resolve([]));
const propose = vi.fn(async () => 'crystal-1');
const crystallize = vi.fn(async () => undefined);
const refute = vi.fn(async () => undefined);
const supersede = vi.fn(async () => undefined);

vi.mock('../../kernel/instances', () => ({
    crystalVault: { list, propose, crystallize, refute, supersede },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CrystalVaultPanel (FT-01)', () => {
    it('renders the title, total count, calls list() and shows the empty state', async () => {
        const CrystalVaultPanel = (await import('./CrystalVaultPanel')).default;
        render(<CrystalVaultPanel />);
        expect(await screen.findByText('lenses_crystal.title')).toBeDefined();
        expect(screen.getByText('0 lenses_crystal.total')).toBeDefined();
        expect(await screen.findByText('lenses_crystal.empty')).toBeDefined();
        expect(list).toHaveBeenCalled();
    });

    it('opens the propose modal when the propose button is clicked', async () => {
        const CrystalVaultPanel = (await import('./CrystalVaultPanel')).default;
        render(<CrystalVaultPanel />);
        await screen.findByText('lenses_crystal.title');
        fireEvent.click(screen.getByText('lenses_crystal.propose'));
        expect(await screen.findByText(/lenses_crystal\.form_statement/)).toBeDefined();
    });
});
