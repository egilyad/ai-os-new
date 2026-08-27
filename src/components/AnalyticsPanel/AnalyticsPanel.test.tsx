import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'analytics.title': 'Analytics & Fleet Telemetry',
                'analytics.subtitle': 'Real-time metrics across all providers',
                'analytics.tab.overview': 'Platform Overview',
                'analytics.tab.providers': 'Provider Health',
                'analytics.tab.decisions': 'Router Log',
                'analytics.metric.total_invocations': 'Total Invocations',
                'analytics.metric.total_tokens': 'Total Tokens',
                'analytics.metric.platform_spend': 'Platform Spend',
                'analytics.metric.fleet_latency': 'Avg TTFT',
                'analytics.chart.token_throughput': 'Token Throughput',
                'analytics.time_24h': '24h ago',
                'analytics.time_12h': '12h ago',
                'analytics.time_6h': '6h ago',
                'analytics.time_now': 'Now',
                'analytics.traffic_distribution': 'Traffic Distribution',
                'analytics.empty_traffic_line1': 'No traffic data yet',
                'analytics.empty_traffic_line2': 'Start a debate to see traffic distribution',
                'analytics.optimization_engine': 'Optimization Engine',
                'analytics.optimization_desc':
                    'Real-time provider selection based on performance metrics',
                'analytics.cache_hit_rate': 'Cache Hit Rate',
                'analytics.cache_hits': 'hits',
                'analytics.cache_requests': 'requests',
                'analytics.provider_health': 'Provider Health',
                'analytics.active': 'Active',
                'analytics.degraded': 'Degraded',
                'analytics.offline': 'Offline',
                'analytics.avg_ewma_latency': 'Avg EWMA Latency',
                'analytics.error_rate': 'Error Rate',
                'analytics.reliability': 'Reliability',
            };
            return labels[key] || key;
        },
    }),
}));

vi.mock('../../kernel/instances', () => ({
    kernel: {
        getState: vi.fn(() => ({
            providers: {
                openrouter: {
                    id: 'OpenRouter',
                    avgTTFT: 120,
                    avgTPS: 30,
                    reliability: 0.95,
                    selectionRate: 0.6,
                    status: 'healthy',
                    totalRequests: 60,
                    stabilityIndex: 0.9,
                    reputationScore: 95,
                },
                groq: {
                    id: 'Groq',
                    avgTTFT: 80,
                    avgTPS: 45,
                    reliability: 0.98,
                    selectionRate: 0.4,
                    status: 'healthy',
                    totalRequests: 40,
                    stabilityIndex: 0.95,
                    reputationScore: 90,
                },
            },
            weights: {
                base: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
                adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                effective: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            },
            decisions: [
                {
                    requestId: 'd1',
                    strategy: 'performance',
                    selected: 'Groq',
                    secondBest: 'OpenRouter',
                    scores: [
                        { p: 'Groq', s: '0.85' },
                        { p: 'OpenRouter', s: '0.72' },
                    ],
                    timestamp: Date.now() - 5000,
                },
            ],
            totalRequests: 100,
            totalTokens: 50000,
            estimatedCost: 0.5,
            explorationFactor: 0.1,
            history: [],
            violations: [],
            activeSLA: 'BALANCED',
        })),
    },
    cacheService: { getStats: vi.fn(() => ({ hits: 0, misses: 0, ratio: 0 })) },
    providerTracker: { getHealthEvents: vi.fn(() => []) },
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn(), off: vi.fn() },
    EVENTS: { KERNEL_UPDATED: 'kernel:updated', NOTIFICATION: 'notification' },
}));

describe('AnalyticsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        const { container } = render(<AnalyticsPanel />);
        expect(container).toBeDefined();
    }, 30000);

    it('displays Analytics heading', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getByText(/Analytics & Fleet Telemetry/)).toBeDefined();
    });

    it('shows summary stats', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getByText('Total Invocations')).toBeDefined();
        expect(screen.getByText('Total Tokens')).toBeDefined();
        expect(screen.getByText('Platform Spend')).toBeDefined();
        expect(screen.getByText('Avg TTFT')).toBeDefined();
    });

    it('shows total request count', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    });

    it('shows tab buttons', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getByRole('tab', { name: 'Platform Overview' })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Provider Health' })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Router Log' })).toBeDefined();
    });

    it('switches to providers tab on click', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        fireEvent.click(screen.getByRole('tab', { name: 'Provider Health' }));
        expect(screen.getByText('OpenRouter')).toBeDefined();
        expect(screen.getByText('Groq')).toBeDefined();
    });

    it('switches to decisions tab on click', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        fireEvent.click(screen.getByText('Router Log'));
        expect(screen.getByText('performance')).toBeDefined();
    });

    it('shows traffic distribution section', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getByText('Traffic Distribution')).toBeDefined();
    });

    it('shows token throughput section', async () => {
        const AnalyticsPanel = (await import('./AnalyticsPanel')).default;
        render(<AnalyticsPanel />);
        expect(screen.getByText(/Token Throughput/)).toBeDefined();
    });
});
