import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockKeyStoreState = {
    keys: [
        {
            id: '1',
            provider: 'OpenRouter',
            label: 'Main',
            status: 'active',
            latency: 120,
            stats: { successCount: 50 },
        },
        {
            id: '2',
            provider: 'Groq',
            label: 'Cloud',
            status: 'inactive',
            stats: { successCount: 0 },
        },
    ],
    checkAllHealth: vi.fn(),
};

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: (selector?: (s: typeof mockKeyStoreState) => unknown) =>
        selector ? selector(mockKeyStoreState) : mockKeyStoreState,
}));

vi.mock('../../core/Kernel', () => ({
    kernel: {
        getState: vi.fn(() => ({
            providers: {
                openrouter: { id: 'OpenRouter', avgTTFT: 120, avgTPS: 30, reliability: 0.95 },
            },
            weights: {
                base: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
                adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                effective: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            },
            decisions: [],
            totalRequests: 100,
            totalTokens: 5000,
            estimatedCost: 0.05,
            explorationFactor: 0.1,
            history: [],
            violations: [],
            activeSLA: 'BALANCED',
        })),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'dashboard.mission_control': 'Mission Control',
                'dashboard.system_online': 'System Online',
                'dashboard.active_llms': 'Active LLMs',
                'dashboard.global_throughput': 'Global Throughput',
                'dashboard.token_burn': 'Token Burn',
                'dashboard.calculated_cost': 'Calculated Cost',
                'dashboard.awaiting_telemetry': 'Awaiting telemetry data...',
                'dashboard.run_diagnostics': 'Run Diagnostics',
                'dashboard.add_provider': 'Add Provider',
                'dashboard.subtitle': 'System Overview',
                'dashboard.system_health': 'System Health',
                'dashboard.resource_pressure_map': 'Resource Pressure Map',
                'dashboard.routing_activity': 'Routing Activity',
                'dashboard.inference_mesh': 'Inference Mesh',
                'dashboard.live_system_stream': 'Live System Stream',
                'dashboard.new_debate': 'New Debate',
                'dashboard.open_sandbox': 'Open Sandbox',
                'dashboard.system_attention_required': 'System Attention Required',
                'dashboard.review_logs': 'Review Logs',
                'dashboard.health_label': 'Health',
                'dashboard.error_rate_label': 'Error Rate',
                'dashboard.quota_burn_label': 'Quota Burn',
                'dashboard.latency_label': 'Latency',
                'dashboard.active_count': 'Active: {count}',
                'dashboard.error_count': 'Errors: {count}',
                'dashboard.details': 'Details',
                'dashboard.full_view': 'Full View',
                'dashboard.configure': 'Configure',
                'dashboard.pools': 'Pools',
                'dashboard.add_provider_aria': 'Add Provider',
                'dashboard.run_diagnostics_aria': 'Run Diagnostics',
                'dashboard.review_logs_aria': 'Review Logs',
                'dashboard.no_providers': 'No Providers',
                'dashboard.connect_provider': 'Connect Provider',
                'dashboard.inspect': 'Inspect',
                'dashboard.inspect_aria': 'Inspect',
                'dashboard.no_routing_decisions': 'No routing decisions',
                'dashboard.real_time_metrics': 'Real-Time Metrics',
                'dashboard.rps': 'RPS',
                'dashboard.latency_p50': 'P50 Latency',
                'dashboard.today_reqs': "Today's Requests",
                'dashboard.cost_today': "Today's Cost",
                'dashboard.ms_avg': 'ms avg',
                'dashboard.dash': '-',
                'dashboard.health_score': 'Health Score',
                'dashboard.status_label': 'Status',
                'dashboard.token_spark': 'Token Spark',
                'dashboard.trend_improving': 'Trend: Improving',
                'dashboard.trend_worsening': 'Trend: Worsening',
                'dashboard.trend_stable': 'Trend: Stable',
                'dashboard.active_debates': 'Active Debates',
                'dashboard.active_debates_hint': 'Debates in progress',
                'dashboard.active_llms_hint': 'Active / Total keys',
                'dashboard.calculated_cost_hint': 'Estimated cost this month',
                'dashboard.token_burn_hint': 'Tokens consumed today',
                'dashboard.reqs_unit': 'reqs',
                'dashboard.today_sessions': '{count} sessions today',
                'common.active': 'Active',
                'common.disabled': 'Disabled',
                'common.dismiss_error': 'Dismiss',
                'onboarding.dashboard_get_started_title': 'Get Started',
                'onboarding.dashboard_get_started_body':
                    'Add your first API key to start using the system.',
                'onboarding.dashboard_explore': 'Explore',
                'onboarding.dashboard_add_key': 'Add Key',
                'chat.latency_ms': 'ms',
                'dashboard.rps_hint': 'Requests per second',
                'dashboard.alert_provider_errors': 'Provider errors detected',
            };
            return labels[key] || key;
        },
    }),
}));

vi.mock('../../kernel/instances', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        onSafe: vi.fn(() => vi.fn()),
        off: vi.fn(),
        subscribeAll: vi.fn(() => vi.fn()),
    },
    EVENTS: {
        NOTIFICATION: 'system:notification',
        KERNEL_UPDATED: 'kernel:updated',
        COGNITIVE_TRACE_UPDATED: 'cognitive:trace:updated',
        SYSTEM_HEALTH_CHANGED: 'system:health:changed',
    },
    kernel: {
        getState: vi.fn(() => ({
            providers: {
                openrouter: { id: 'OpenRouter', avgTTFT: 120, avgTPS: 30, reliability: 0.95 },
            },
            weights: {
                base: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
                adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                effective: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            },
            decisions: [],
            totalRequests: 100,
            totalTokens: 5000,
            estimatedCost: 0.05,
            explorationFactor: 0.1,
            history: [],
            violations: [],
            activeSLA: 'BALANCED',
        })),
    },
    pricingService: {
        getBudgetInfo: vi.fn(() => ({ spentThisMonth: 0.05 })),
    },
    budgetService: {
        getBudgetInfo: vi.fn(() => ({ spentThisMonth: 0.05 })),
    },
    settingsService: {
        getSettings: vi.fn(() => ({
            notifications: true,
            autoHealthCheck: true,
            defaultMode: 'smart',
            streamingEnabled: true,
            historyPersistence: true,
            fallbackEnabled: true,
            debugMode: false,
            theme: 'dark',
            language: 'en',
            explorationFactor: 0.1,
            slaMode: 'BALANCED',
        })),
        subscribe: vi.fn(() => vi.fn()),
    },
    routerService: {
        getDecisionHistory: vi.fn(() => []),
        getRawConfig: vi.fn(() => ({ fallbackChains: {}, modelDowngradeChains: {} })),
    },
    monitoringService: {
        getSystemHealthIndicators: vi.fn(() => null),
    },
    FREE_TIER_LIMITS: { groq: { requestsPerDay: 1000 }, openrouter: { requestsPerDay: 500 } },
    cognitiveService: {
        getTraces: vi.fn(() => [
            { id: 't1', startTime: Date.now() - 1000, totalTokens: 100 },
            { id: 't2', startTime: Date.now() - 2000, totalTokens: 200 },
        ]),
    },
    debateEngine: {
        init: vi.fn(() => Promise.resolve()),
        createRoom: vi.fn(() => Promise.resolve('room-1')),
        closeRoom: vi.fn(() => Promise.resolve()),
        setActiveRoom: vi.fn(),
        getActiveRoom: vi.fn(() => null),
        listRooms: vi.fn(() => []),
        getRoomEntry: vi.fn(() => undefined),
        syncFromEngine: vi.fn(() => Promise.resolve()),
        getIndex: vi.fn(() => ({ rooms: [], activeRoomId: null, lastUpdated: Date.now() })),
        destroy: vi.fn(),
    },
}));

describe('DashboardPanel', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        const { container } = render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(container).toBeDefined();
    }, 15000);

    it('displays Mission Control heading', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('Mission Control')).toBeDefined();
    });

    it('shows system online indicator', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('System Online')).toBeDefined();
    });

    it('displays provider stats', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('Active LLMs')).toBeDefined();
        expect(screen.getByText('Global Throughput')).toBeDefined();
        expect(screen.getByText('Token Burn')).toBeDefined();
        expect(screen.getByText('Calculated Cost')).toBeDefined();
    });

    it('shows active LLM count', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('1/2')).toBeDefined();
    });

    it('renders provider rows', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        const mains = screen.getAllByText('Main');
        expect(mains.length).toBeGreaterThanOrEqual(1);
        const clouds = screen.getAllByText('Cloud');
        expect(clouds.length).toBeGreaterThanOrEqual(1);
    });

    it('shows event log area', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('Awaiting telemetry data...')).toBeDefined();
    });

    it('has Run Diagnostics button', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        expect(screen.getByText('Run Diagnostics')).toBeDefined();
    });

    it('has Add Provider button that navigates', async () => {
        const DashboardPanel = (await import('./DashboardPanel')).default;
        render(<DashboardPanel onNavigate={mockNavigate} />);
        const addBtn = screen.getByText('Add Provider');
        fireEvent.click(addBtn);
        expect(mockNavigate).toHaveBeenCalledWith('keys');
    });
});
