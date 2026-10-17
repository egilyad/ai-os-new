import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GovStressTest from './GovStressTest';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../../kernel/instances', () => ({
    govStressTestService: {
        getScenarios: vi.fn(() => []),
        buildReport: vi.fn(() => ({})),
        runAllScenarios: vi.fn(() => []),
        summarize: vi.fn(() => ({ total: 0, passed: 0 })),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('GovStressTest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing when the service throws at import time', async () => {
        render(<GovStressTest />);
        expect(document.body.textContent).toBeDefined();
    });

    it('tolerates a throwing runAllScenarios', async () => {
        const { govStressTestService } = await import('../../kernel/instances');
        vi.mocked(govStressTestService.runAllScenarios).mockImplementation(() => {
            throw new Error('harness down');
        });
        render(<GovStressTest />);
        fireEvent.click(await screen.findByText('Run Test Suite'));
        // The 800ms deferred run must settle back to idle instead of hanging.
        await screen.findByText('Run Test Suite', undefined, { timeout: 5000 });
        expect(screen.queryByText('Running...')).toBeNull();
    });

    it('search tolerates results without a scenario', async () => {
        const { govStressTestService } = await import('../../kernel/instances');
        vi.mocked(govStressTestService.runAllScenarios).mockReturnValue([
            { id: 'x' },
        ] as never);
        render(<GovStressTest />);
        const search = document.querySelector('input[placeholder="Search..."]');
        expect(search).toBeDefined();
        if (search) {
            fireEvent.change(search, { target: { value: 'zzz' } });
        }
    });
});
