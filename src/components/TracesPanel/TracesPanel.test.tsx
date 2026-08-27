import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockTraces = [
    {
        id: 'trace-1',
        traceId: 'tr-1',
        startTime: Date.now() - 10000,
        input: 'Test request',
        status: 'completed',
        steps: [{ id: 's1', label: 'Step 1', status: 'done', timestamp: Date.now() }],
        decisionGraph: { nodes: [], edges: [] },
        totalLatency: 500,
        totalTokens: 100,
        estimatedCost: 0.01,
        semanticConfidence: 0.95,
    },
    {
        id: 'trace-2',
        traceId: 'tr-2',
        startTime: Date.now() - 5000,
        input: 'Another request',
        status: 'running',
        steps: [{ id: 's2', label: 'Step 1', status: 'active', timestamp: Date.now() }],
        decisionGraph: { nodes: [], edges: [] },
        totalLatency: 0,
        totalTokens: 0,
        estimatedCost: 0,
        semanticConfidence: 0.8,
    },
    {
        id: 'trace-3',
        traceId: 'tr-3',
        startTime: Date.now() - 20000,
        input: 'Failed request',
        status: 'failed',
        steps: [{ id: 's3', label: 'Step 1', status: 'error', timestamp: Date.now() }],
        decisionGraph: { nodes: [], edges: [] },
        totalLatency: 1000,
        totalTokens: 50,
        estimatedCost: 0.005,
        semanticConfidence: 0.3,
    },
];

vi.mock('../../kernel/instances', () => ({
    cognitiveService: {
        getTraces: vi.fn(() => mockTraces),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => vi.fn()),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
        onSafe: vi.fn(() => vi.fn()),
    },
    EVENTS: { NOTIFICATION: 'notification' },
}));

vi.mock('./CognitiveMicroscope', () => ({ default: () => <div>Microscope</div> }));
vi.mock('./DecisionGraph', () => ({ default: () => <div>Graph</div> }));

vi.mock('../../i18n/useTranslation', () => {
    const translations: Record<string, string> = {
        'traces.title': 'Observability & Traces',
        'traces.subtitle': 'Real-time AI decision path monitoring',
        'traces.search_placeholder': 'Search traces by input or trace ID...',
        'traces.total': 'Total Traces',
        'traces.completed': 'Completed',
        'traces.failed': 'Failed',
        'traces.avg_confidence': 'Avg Confidence',
        'traces.debugger_title': 'Trace Debugger (Live Replay)',
        'traces.tab.audit': 'Audit Trail',
        'traces.tab.neural': 'Neural Graph',
        'common.dismiss_error': 'Dismiss error',
        'traces.table.trace_id': 'Trace ID',
        'traces.header_input': 'Input',
        'traces.table.status': 'Status',
        'traces.table.steps': 'Steps',
        'traces.header_confidence': 'Confidence',
        'traces.table.actions': 'Actions',
        'traces.certainty_label': 'Certainty',
        'traces.inspect_aria': 'Inspect Trace',
        'traces.delete_aria': 'Delete Trace',
        'traces.loading': 'Loading traces...',
        'traces.empty': 'No traces found matching your criteria.',
    };
    return {
        useTranslation: () => ({
            t: (key: string) => translations[key] ?? key,
            lang: 'en',
        }),
    };
});

describe('TracesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Observability & Traces heading', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('Observability & Traces')).toBeDefined();
    });

    it('displays trace items', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('Test request')).toBeDefined();
        expect(screen.getByText('Another request')).toBeDefined();
        expect(screen.getByText('Failed request')).toBeDefined();
    });

    it('shows trace IDs', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('tr-1')).toBeDefined();
        expect(screen.getByText('tr-2')).toBeDefined();
        expect(screen.getByText('tr-3')).toBeDefined();
    });

    it('shows stats row with counts', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('Total Traces')).toBeDefined();
        expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Avg Confidence')).toBeDefined();
    });

    it('shows correct stat values', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('3')).toBeDefined(); // Total
        const ones = screen.getAllByText('1');
        expect(ones.length).toBeGreaterThanOrEqual(2); // Completed + Failed
    });

    it('renders filter buttons', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        expect(await screen.findByText('all')).toBeDefined();
        expect(screen.getAllByText('running').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('completed').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('failed').length).toBeGreaterThanOrEqual(1);
    });

    it('filters traces by status', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Test request');
        fireEvent.click(screen.getAllByText('completed')[0]);
        expect(screen.getByText('Test request')).toBeDefined();
        await waitFor(() => {
            expect(screen.queryByText('Another request')).toBeNull();
        });
    });

    it('search filters traces', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Test request');
        const search = document.querySelector(
            'input[placeholder*="Search traces"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'Failed' } });
        expect(screen.getByText('Failed request')).toBeDefined();
        await waitFor(() => {
            expect(screen.queryByText('Test request')).toBeNull();
        });
    });

    it('shows status badges with colors', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Observability & Traces');
        expect(screen.getAllByText('completed').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('running').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('failed').length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when search yields no results', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Test request');
        const search = document.querySelector(
            'input[placeholder*="Search traces"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'ZZZNoMatch' } });
        expect(await screen.findByText('No traces found matching your criteria.')).toBeDefined();
    });

    it('handles rapid filter switching', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Test request');
        fireEvent.click(screen.getAllByText('completed')[0]);
        await waitFor(() => expect(screen.queryByText('Another request')).toBeNull());
        fireEvent.click(screen.getAllByText('failed')[0]);
        await waitFor(() => expect(screen.queryByText('Test request')).toBeNull());
        fireEvent.click(screen.getAllByText('all')[0]);
        await waitFor(() => expect(screen.getByText('Test request')).toBeDefined());
    });

    it('clicking trace opens detail panel', async () => {
        const TracesPanel = (await import('./TracesPanel')).default;
        render(<TracesPanel />);
        await screen.findByText('Test request');
        fireEvent.click(screen.getByText('Test request'));
        expect(await screen.findByText('Trace Debugger (Live Replay)')).toBeDefined();
    });
});
