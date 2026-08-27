import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockOn = vi.fn(() => vi.fn()) as unknown as (...args: unknown[]) => ReturnType<typeof vi.fn>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetAlerts = vi.fn(() => [] as any[]);

vi.mock('../../kernel/instances', () => ({
    eventBus: {
        emit: vi.fn(),
        on: (...args: unknown[]) => mockOn(...args),
        onSafe: (...args: unknown[]) => mockOn(...args),
        off: vi.fn(),
        subscribeAll: vi.fn(() => vi.fn()),
    },
    EVENTS: {
        NOTIFICATION: 'system:notification',
        KEY_QUOTA_EXCEEDED: 'key:quota:exceeded',
        KEY_LATENCY_BURST: 'key:latency:burst',
        KEY_HEALTH_CHECK_FAILED: 'key:health:check:failed',
        KEY_REPUTATION_THRESHOLD_CROSSED: 'key:reputation:threshold:crossed',
        KEY_STATE_CHANGED: 'key:state:changed',
        KEY_UPDATED: 'key:updated',
        METRICS_ALERT: 'observability:metrics:alert',
    },
    keyService: {
        getAlerts: () => mockGetAlerts(),
    },
    settingsService: { getSettings: () => ({ language: 'en' }), subscribe: () => () => {} },
}));

describe('AlertLayer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAlerts.mockReturnValue([]);
    });

    it('renders without crashing', async () => {
        const AlertLayer = (await import('./AlertLayer')).default;
        const { container } = render(<AlertLayer />);
        expect(container).toBeDefined();
    });

    it('subscribes to events on mount', async () => {
        const AlertLayer = (await import('./AlertLayer')).default;
        render(<AlertLayer />);
        expect(mockOn).toHaveBeenCalled();
    });

    it('shows alert count badge when alerts exist', async () => {
        mockGetAlerts.mockReturnValue([
            {
                id: 'a1',
                type: 'quota_warning',
                severity: 'critical',
                message: 'Quota exceeded',
                timestamp: Date.now(),
                resolved: false,
            },
            {
                id: 'a2',
                type: 'rate_limit',
                severity: 'high',
                message: 'Rate limited',
                timestamp: Date.now(),
                resolved: false,
            },
        ]);
        const AlertLayer = (await import('./AlertLayer')).default;
        render(<AlertLayer />);
        expect(await screen.findByText(/1 critical/)).toBeDefined();
    });

    it('expands alert list on click', async () => {
        mockGetAlerts.mockReturnValue([
            {
                id: 'a1',
                type: 'quota_warning',
                severity: 'critical',
                message: 'Test alert',
                timestamp: Date.now(),
                resolved: false,
            },
        ]);
        const AlertLayer = (await import('./AlertLayer')).default;
        render(<AlertLayer />);
        const btn = await screen.findByText(/1 critical/);
        btn.click();
        expect(await screen.findByText('Test alert')).toBeDefined();
    });
});
