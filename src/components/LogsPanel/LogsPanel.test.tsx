import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockEntries = [
    {
        timestamp: Date.now() - 1000,
        level: 'info',
        service: 'router',
        message: 'Route selected',
        traceId: 'trace-abc-123',
    },
    {
        timestamp: Date.now() - 2000,
        level: 'error',
        service: 'keys',
        message: 'Probe failed',
    },
];

vi.mock('../../kernel/instances', () => ({
    rootLogger: {
        getBuffer: vi.fn(() => [...mockEntries]),
        exportLogs: vi.fn(() => 'exported-content'),
        clear: vi.fn(),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: { NOTIFICATION: 'notification' },
}));

// jsdom has no layout — the real virtualizer renders zero rows. Stub it to
// render every row so list content is actually asserted.
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count }: { count: number }) => ({
        getTotalSize: () => count * 36,
        getVirtualItems: () =>
            Array.from({ length: count }, (_, index) => ({ index, start: index * 36 })),
        measureElement: () => {},
        scrollToIndex: vi.fn(),
        scrollToOffset: vi.fn(),
    }),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string | number>) => {
            const map: Record<string, string> = {
                'logs.title': 'System Logs',
                'logs.subtitle': '{count} log entries',
                'logs.search_placeholder': 'Search logs...',
                'logs.filter_all': 'All',
                'logs.filter_all_levels': 'All levels',
                'logs.filter_debug': 'Debug',
                'logs.filter_info': 'Info',
                'logs.filter_warn': 'Warn',
                'logs.filter_error': 'Error',
                'logs.filter_all_services': 'All services',
                'logs.auto_scroll': 'Auto Scroll',
                'logs.clear': 'Clear',
                'logs.clear_title': 'Clear logs',
                'logs.empty': 'No logs yet',
                'logs.export': 'Export',
                'logs.export_title': 'Export logs',
                'logs.exported_empty': 'Nothing to export',
                'logs.col_timestamp': 'Time',
                'logs.col_level': 'Level',
                'logs.col_service': 'Service',
                'logs.col_trace_id': 'Trace',
                'logs.col_message': 'Message',
            };
            let text = map[key] ?? key;
            for (const [k, v] of Object.entries(params ?? {})) {
                text = text.replace(`{${k}}`, String(v));
            }
            return text;
        },
    }),
}));

describe('LogsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders buffered entries', async () => {
        const { LogsPanel } = await import('./LogsPanel');
        render(<LogsPanel />);
        expect(await screen.findByText('Route selected')).toBeDefined();
        expect(screen.getByText('Probe failed')).toBeDefined();
        expect(screen.getByText('System Logs')).toBeDefined();
    });

    it('search tolerates legacy entries without message or service', async () => {
        const { rootLogger } = await import('../../kernel/instances');
        vi.mocked(rootLogger.getBuffer).mockReturnValueOnce([
            { timestamp: Date.now(), level: 'info' },
        ] as never);
        const { LogsPanel } = await import('./LogsPanel');
        render(<LogsPanel />);
        await screen.findByText('System Logs');
        fireEvent.change(screen.getByPlaceholderText('Search logs...'), {
            target: { value: 'zzz' },
        });
        expect(await screen.findByText('No logs yet')).toBeDefined();
    });

    it('renders a dash for invalid timestamps instead of crashing', async () => {
        const { rootLogger } = await import('../../kernel/instances');
        vi.mocked(rootLogger.getBuffer).mockReturnValueOnce([
            { timestamp: Number.NaN, level: 'info', service: 'x', message: 'bad time' },
        ] as never);
        const { LogsPanel } = await import('./LogsPanel');
        render(<LogsPanel />);
        expect(await screen.findByText('bad time')).toBeDefined();
        expect(screen.getByText('—')).toBeDefined();
    });

    it('says out loud when there is nothing to export', async () => {
        const { rootLogger, eventBus } = await import('../../kernel/instances');
        vi.mocked(rootLogger.exportLogs).mockReturnValueOnce('');
        const { LogsPanel } = await import('./LogsPanel');
        render(<LogsPanel />);
        await screen.findByText('System Logs');
        fireEvent.click(screen.getByText('Export'));
        expect(eventBus.emit).toHaveBeenCalledWith(
            'notification',
            expect.objectContaining({ message: 'Nothing to export' }),
        );
    });
});
