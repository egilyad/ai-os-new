import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

const listActiveJobs = vi.fn(() => Promise.resolve([]));
const generateFromTrigger = vi.fn(async () => 'job-1');
const getStatus = vi.fn(async () => undefined);
const cancel = vi.fn(async () => undefined);

vi.mock('../../kernel/instances', () => ({
    knowledgeGenerator: { listActiveJobs, generateFromTrigger, getStatus, cancel },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('KnowledgeGenPanel (FT-01)', () => {
    it('renders the title and loads active jobs on mount', async () => {
        const KnowledgeGenPanel = (await import('./KnowledgeGenPanel')).default;
        render(<KnowledgeGenPanel />);
        expect(await screen.findByText('generator.title')).toBeDefined();
        expect(screen.getAllByText('0 generator.jobs_active').length).toBeGreaterThan(0);
        await waitFor(() => expect(listActiveJobs).toHaveBeenCalled());
    });

    it('reloads jobs when the refresh button is clicked', async () => {
        const KnowledgeGenPanel = (await import('./KnowledgeGenPanel')).default;
        render(<KnowledgeGenPanel />);
        await screen.findByText('generator.title');
        fireEvent.click(screen.getByTitle('generator.refresh'));
        expect(listActiveJobs.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
