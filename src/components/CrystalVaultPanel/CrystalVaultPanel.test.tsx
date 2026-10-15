import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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

const list = vi.fn((..._args: unknown[]): Promise<unknown[]> => Promise.resolve([]));
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
    afterEach(() => {
        cleanup();
    });

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

    it('searches elaboration and evidence, not only statements (Zone 4)', async () => {
        list.mockImplementationOnce(async () => [
            {
                crystalId: 'c1',
                version: 1,
                status: 'semi',
                createdAt: 1000,
                confidence: 0.5,
                contradictingCrystalIds: [],
                supportingCrystalIds: [],
                linkedLensIds: [],
                linkedRoleIds: [],
                applicableDomain: 'general',
                contentHash: 'abc',
                provenance: {
                    originKind: 'human',
                    originId: 'test',
                    contributingAgents: [],
                    modelIds: [],
                    totalTokensSpent: 0,
                },
                validation: {
                    proArguments: [],
                    conArguments: [],
                    reviewers: [],
                    humanApproved: false,
                },
                content: {
                    statement: 'Sleep improves memory',
                    elaboration: 'REM sleep consolidates hippocampal traces',
                    evidence: ['study 2024'],
                },
            },
        ]);
        const CrystalVaultPanel = (await import('./CrystalVaultPanel')).default;
        render(<CrystalVaultPanel />);
        await screen.findByText('Sleep improves memory');
        fireEvent.change(screen.getByPlaceholderText('lenses_crystal.search'), {
            target: { value: 'hippocampal' },
        });
        expect(await screen.findByText('Sleep improves memory')).toBeDefined();
    });

    it('shows list failures instead of an empty-state lie (Zone 4)', async () => {
        list.mockRejectedValueOnce(new Error('db down'));
        const CrystalVaultPanel = (await import('./CrystalVaultPanel')).default;
        render(<CrystalVaultPanel />);
        expect(await screen.findByText(/db down/)).toBeDefined();
    });
});
