import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'health.system_health_matrix': 'System Health Matrix',
                'health.subtitle': 'System Health Overview',
                'health.all_systems_operational': 'ALL SYSTEMS OPERATIONAL',
                'health.quick_test_aria': 'Quick Test All',
                'health.quick_test_all': 'Quick Test All',
                'health.refresh_aria': 'Refresh Status',
                'common.dismiss_error': 'Dismiss error',
                'health.cpu_load': 'CPU Load',
                'health.memory_allocation': 'Memory Allocation',
                'health.system_uptime': 'System Uptime',
                'health.throughput': 'Throughput',
                'health.data_encryption': 'AES-256 Encryption',
                'health.error_refresh': 'Failed to refresh system health',
                'health.distributed_nodes': 'Distributed Nodes',
                'health.active_workers': 'Active Workers',
                'health.bee_title': 'Worker',
                'health.auto_routing': 'Auto Routing',
                'health.sub_10ms': '<10ms',
                'health.offline': 'OFFLINE',
                'health.ping_latency': 'Ping Latency',
                'health.no_external_nodes': 'No External Nodes',
                'health.kernel_services': 'Kernel Services',
                'health.loading_services': 'Loading services...',
                'health.core_microservice': 'Core Microservice',
                'health.status_aria': 'Service status',
                'health.probe_title': 'Probe Results',
                'health.probe_ready': 'Ready',
                'health.probe_active_table': 'Active Probes',
                'health.no_response': 'No Response',
                'health.rate_limit_introspection': 'Rate Limit Introspection',
                'health.quota_subtitle': 'Quota Overview',
                'health.rate_limit_requests': 'Requests',
                'health.rate_limit_tokens': 'Tokens',
                'health.rate_limit_429s': '429 Errors',
                'health.pressure_label': 'Pressure',
                'health.loading_introspection': 'Loading introspection...',
                'health.no_api_keys': 'No API Keys',
                'health.health_score_title': 'Health Score Overview',
                'health.event_latency_spike': 'Latency Spike',
                'health.event_error_burst': 'Error Burst',
                'health.event_status_change': 'Status Change',
                'health.event_rate_limit': 'Rate Limit',
                'health.event_recovery': 'Recovery',
                'health.health_timeline': 'Health Timeline',
                'health.timeline_empty': 'No events recorded',
            };
            return labels[key] || key;
        },
    }),
}));

const mockKeys = [
    { id: '1', provider: 'OpenRouter', key: '', label: 'Main', status: 'active', stats: {} },
    { id: '2', provider: 'Groq', key: '', label: 'Cloud', status: 'inactive', stats: {} },
];

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: () => ({
        keys: mockKeys,
    }),
}));

vi.mock('../../kernel/instances', () => ({
    adminService: {
        getSystemHealth: vi.fn(() => ({
            status: 'healthy',
            version: '2.4.0',
            uptime: 3600,
            vitals: {
                cpu: 45,
                memory: 512,
                throughput: 120,
                totalRequests: 1000,
                totalTokens: 50000,
            },
            services: [
                { name: 'Kernel', status: 'ready' },
                { name: 'Event Bus', status: 'active' },
                { name: 'Agent Mesh', status: 'online' },
            ],
        })),
        reloadRuntime: vi.fn(),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => vi.fn()),
    },
    keyService: {
        getAlerts: vi.fn(() => []),
        getProviderIntrospection: vi.fn(() => ({})),
    },
    kernel: {
        getHealthEvents: vi.fn(() => []),
    },
    probeService: {
        probeAll: vi.fn(() => Promise.resolve({})),
    },
    keyStateStore: {
        getAll: vi.fn(() => []),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        onSafe: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: { NOTIFICATION: 'system:notification' },
}));

describe('HealthPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        const { container } = render(<HealthPanel />);
        expect(container).toBeDefined();
    }, 20000);

    it('displays system health matrix heading', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('System Health Matrix')).toBeDefined();
    });

    it('shows all systems operational', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('ALL SYSTEMS OPERATIONAL')).toBeDefined();
    });

    it('displays CPU vitals', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('45.0%')).toBeDefined();
    });

    it('displays memory allocation', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('512 MB')).toBeDefined();
    });

    it('displays system uptime', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('3600s')).toBeDefined();
    });

    it('displays throughput', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('120')).toBeDefined();
    });

    it('renders service statuses', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('Kernel')).toBeDefined();
        expect(screen.getByText('Event Bus')).toBeDefined();
        expect(screen.getByText('Agent Mesh')).toBeDefined();
    });

    it('renders provider nodes from store', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getAllByText('OpenRouter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Groq').length).toBeGreaterThan(0);
    });

    it('shows offline status for inactive key', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText('OFFLINE')).toBeDefined();
    });

    it('shows security footer', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText(/AES-256/)).toBeDefined();
    });

    it('shows build version', async () => {
        const HealthPanel = (await import('./HealthPanel')).default;
        render(<HealthPanel />);
        expect(screen.getByText(/BUILD_VER/)).toBeDefined();
    });
});
