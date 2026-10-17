import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    debateEngine: {
        getActiveSessions: vi.fn(() => []),
    },
    whatIfService: {
        simulateTopologyChange: vi.fn(() => Promise.resolve({ recommendation: 'ok', delta: 1 })),
        simulateParticipantChange: vi.fn(() => Promise.resolve({})),
        simulateBudgetChange: vi.fn(() => Promise.resolve({})),
        simulateProviderChange: vi.fn(() => Promise.resolve({})),
        simulateStrategyChange: vi.fn(() => Promise.resolve({})),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => null,
}));

describe('WhatIfPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the simulation surface', async () => {
        const Panel = (await import('./WhatIfPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('What-If Simulation')).toBeDefined();
    });

    it('banners a failed simulation instead of failing silently', async () => {
        const { whatIfService, debateEngine } = await import('../../kernel/instances');
        vi.mocked(debateEngine.getActiveSessions).mockReturnValue([
            { id: 's1', topic: 'T' },
        ] as never);
        vi.mocked(whatIfService.simulateTopologyChange).mockRejectedValueOnce(
            new Error('sim backend down'),
        );
        const Panel = (await import('./WhatIfPanel')).default;
        render(<Panel />);
        await screen.findByText('What-If Simulation');
        // First card is the topology sim: pick the session, then run.
        const sessionSelect = document.querySelectorAll('select')[0]!;
        fireEvent.change(sessionSelect, { target: { value: 's1' } });
        fireEvent.click(screen.getAllByText('Simulate')[0]!);
        expect(await screen.findByText('sim backend down')).toBeDefined();
        expect(screen.getByRole('alert')).toBeDefined();
    });

    it('shows empty results state initially', async () => {
        const Panel = (await import('./WhatIfPanel')).default;
        render(<Panel />);
        await screen.findByText('What-If Simulation');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
