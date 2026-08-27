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

vi.mock('../../stores/directorStore', () => ({
    useDirectorStore: () => ({
        sessionId: 's1',
        status: 'idle',
        currentParticipantId: null,
        turnLog: [],
        reset: vi.fn(),
    }),
}));

vi.mock('../../kernel/instances/services-core', () => ({
    agentService: { getAgents: () => [] },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'director.title': 'Conversation Director',
                'director.subtitle': 'Author and run managed, observable conversations',
                'director.tab_configure': 'Configure',
                'director.tab_library': 'Library',
                'director.tab_run': 'Run',
                'director.configure.heading': 'Configure scenario',
                'director.configure.placeholder': 'Scenario editor coming soon.',
                'director.library.heading': 'Scenario library',
                'director.library.placeholder': 'Scenario library coming soon.',
                'director.run.heading': 'Run & observe',
                'director.run.placeholder': 'Run controls coming soon.',
                'director.run.status': 'Status',
                'director.run.current': 'Current participant',
                'director.run.turns': 'Turns observed',
                'director.run.noScenario': 'no scenario',
            };
            return labels[key] || key;
        },
    }),
}));

describe('DirectorPanel (B5.1 skeleton)', () => {
    it('renders the title and the three tab buttons', async () => {
        const DirectorPanel = (await import('./DirectorPanel')).default;
        render(<DirectorPanel />);
        expect(await screen.findByText('Conversation Director')).toBeDefined();
        expect(screen.getByText('Configure')).toBeDefined();
        expect(screen.getByText('Library')).toBeDefined();
        expect(screen.getByText('Run')).toBeDefined();
    });

    it('shows the Configure tab content by default and the Run tab with controls', async () => {
        const DirectorPanel = (await import('./DirectorPanel')).default;
        render(<DirectorPanel />);
        expect(await screen.findByText('Configure scenario')).toBeDefined();

        // switch to Run tab — no scenario selected yet
        screen.getByText('Run').click();
        expect(await screen.findByText('Run & observe')).toBeDefined();
        expect(screen.getByText('no scenario')).toBeDefined();
    });
});
