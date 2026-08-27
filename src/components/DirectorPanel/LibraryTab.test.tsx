import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';

const SAMPLE: ConversationScenario = {
    id: 'scenario-1',
    name: 'Sample Scenario',
    description: 'A test scenario',
    version: 1,
    status: 'active',
    participants: [{ id: 'a', role: 'moderator' }],
    turns: [],
    createdAt: 1,
    updatedAt: 2,
};

// Mutable holder so repeated (incl. StrictMode double-invoked) `list()` calls
// always resolve to a real array — matching the real repository's contract.
let currentList: ConversationScenario[] = [];

const mockList = vi.fn((_opts?: unknown) => Promise.resolve(currentList));
const mockDuplicate = vi.fn((_id: string) => Promise.resolve(undefined));
const mockArchive = vi.fn((_id: string) => Promise.resolve(undefined));
const mockDelete = vi.fn((_id: string) => Promise.resolve(undefined));

vi.mock('../../kernel/instances/services-extras', () => ({
    scenarioRepository: {
        list: (opts?: unknown) => mockList(opts),
        duplicate: (id: string) => mockDuplicate(id),
        archive: (id: string) => mockArchive(id),
        delete: (id: string) => mockDelete(id),
    },
}));

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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'director.library.heading': 'Scenario library',
                'director.library.loading': 'Loading scenarios…',
                'director.library.empty': 'No scenarios yet.',
                'director.library.error': 'Failed to load scenarios.',
                'director.library.filter_all': 'All',
                'director.library.filter_active': 'Active',
                'director.library.filter_draft': 'Draft',
                'director.library.filter_archived': 'Archived',
                'director.library.load': 'Load',
                'director.library.duplicate': 'Duplicate',
                'director.library.archive': 'Archive',
                'director.library.delete': 'Delete',
                'director.library.participants': 'Participants',
                'director.library.turns': 'Turns',
                'director.scenario.status.draft': 'Draft',
                'director.scenario.status.active': 'Active',
                'director.scenario.status.archived': 'Archived',
                'director.run.selected': 'Selected scenario',
                'director.run.selected_none': 'No scenario selected.',
            };
            return labels[key] || key;
        },
    }),
}));

describe('LibraryTab (B5.2)', () => {
    it('shows the empty state when no scenarios exist', async () => {
        currentList = [];
        const LibraryTab = (await import('./LibraryTab')).default;
        render(<LibraryTab onLoad={vi.fn()} />);
        expect(await screen.findByText('No scenarios yet.')).toBeDefined();
    });

    it('renders a scenario card and routes Duplicate to the repository', async () => {
        currentList = [SAMPLE];
        mockDuplicate.mockImplementation(async () => {
            currentList = [
                { ...SAMPLE, id: 'scenario-2', name: 'Sample Scenario (copy)', status: 'draft' },
            ];
        });
        const LibraryTab = (await import('./LibraryTab')).default;
        render(<LibraryTab onLoad={vi.fn()} />);

        expect(await screen.findByText('Sample Scenario')).toBeDefined();
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByText('Duplicate'));
        await waitFor(() => expect(mockDuplicate).toHaveBeenCalledWith('scenario-1'));
        expect(await screen.findByText('Sample Scenario (copy)')).toBeDefined();
    });

    it('filters by status and routes Archive to the repository', async () => {
        currentList = [SAMPLE];
        const LibraryTab = (await import('./LibraryTab')).default;
        render(<LibraryTab onLoad={vi.fn()} />);
        await screen.findByText('Sample Scenario');

        fireEvent.click(screen.getByRole('button', { name: 'Archived' }));
        await waitFor(() => expect(mockList).toHaveBeenCalledWith({ status: 'archived' }));

        fireEvent.click(screen.getByRole('button', { name: 'Active' }));
        await screen.findByText('Sample Scenario');
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Archive'));
        await waitFor(() => expect(mockArchive).toHaveBeenCalledWith('scenario-1'));
    });
});
