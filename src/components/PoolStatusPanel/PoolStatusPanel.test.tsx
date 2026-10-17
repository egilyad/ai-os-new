import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'pool_status.title': 'Resource Pools',
                'pool_status.subtitle': 'Resource pool management',
                'pool_status.view.pools': 'Pools',
                'pool_status.view.providers': 'Providers',
                'pool_status.pool.fast': 'Fast Compute',
                'pool_status.pool.fast_desc': 'Low-latency inference',
                'pool_status.pool.balanced': 'Balanced',
                'pool_status.pool.balanced_desc': 'General-purpose routing',
                'pool_status.pool.free_name': 'Free Tier',
                'pool_status.pool.free_name_desc': 'Zero-cost models',
                'pool_status.pool.experimental': 'Experimental',
                'pool_status.pool.experimental_desc': 'New/unstable providers',
                'pool_status.empty_pool': 'No providers in this pool',
                'pool_status.table.provider': 'Provider',
                'pool_status.table.strategy': 'Strategy',
                'pool_status.table.active': 'Active',
                'pool_status.table.quota_cap': 'Quota Cap',
                'pool_status.table.actions': 'Actions',
                'pool_status.stat.active': 'Active',
                'pool_status.stat.avg_latency': 'Avg Latency',
                'pool_status.stat.keys': 'Keys',
                'pool_status.quota_button': 'Quota',
                'pool_status.key_usage': 'Key Usage',
                'pool_status.edit_quota_title': 'Edit Free Tier Quota',
                'pool_status.reqs_per_day': 'Requests / Day',
                'pool_status.tokens_per_day': 'Tokens / Day',
                'pool_status.status.ok': 'OK',
                'pool_status.status.err': 'Error',
                'common.not_available': 'N/A',
                'common.save': 'Save',
            };
            return map[key] ?? key;
        },
        lang: 'en',
    }),
}));

const { poolState, poolActions } = vi.hoisted(() => ({
    poolState: {
        keys: [] as Array<Record<string, unknown>>,
        quotas: {} as Record<string, unknown>,
    },
    poolActions: {
        setFreeTierLimit: vi.fn(),
        setPoolStrategy: vi.fn(),
        getPoolStrategy: vi.fn(() => 'round-robin'),
        getPoolKeyDistribution: vi.fn(() => []),
    },
}));

vi.mock('../../hooks/usePoolStatus', () => ({
    usePoolStatus: () => ({
        keys: poolState.keys,
        quotas: poolState.quotas,
        actions: poolActions,
    }),
}));

vi.mock('../../constants/pools', () => ({
    POOL_DEFS: [
        {
            id: 'fast',
            name: 'Fast Compute',
            color: '#f59e0b',
            description: 'Low-latency inference for real-time agents',
            providers: ['groq', 'nvidia'],
        },
        {
            id: 'balanced',
            name: 'Balanced',
            color: '#3b82f6',
            description: 'General-purpose routing with cost-quality tradeoff',
            providers: ['gemini', 'openrouter', 'google'],
        },
        {
            id: 'free',
            name: 'Free Tier',
            color: '#10b981',
            description: 'Zero-cost models with quota limits for experimentation',
            providers: ['groq', 'google', 'openrouter'],
        },
        {
            id: 'experimental',
            name: 'Experimental',
            color: '#8b5cf6',
            description: 'New/unstable providers and bleeding-edge models',
            providers: [
                'nvidia',
                'openrouter',
                'together',
                'fireworks',
                'deepseek',
                'mistral',
                'cohere',
            ],
        },
    ],
}));

vi.mock('../ProviderIcon/ProviderIcon', () => ({
    default: ({ provider }: { provider: string }) => (
        <div data-testid={`provider-icon-${provider}`} />
    ),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => <div data-testid="module-info" />,
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: { KEY_UPDATED: 'key:updated' },
}));

vi.mock('../../kernel/instances', () => ({
    keyService: {
        getKeys: vi.fn(() => []),
        getFreeTierLimits: vi.fn(() => ({})),
    },
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: {
        KEY_UPDATED: 'key:updated',
        KEY_ADDED: 'key:added',
        KEY_REMOVED: 'key:removed',
        KEY_STATE_CHANGED: 'key:state:changed',
    },
}));

describe('PoolStatusPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        poolState.keys = [];
        poolState.quotas = {};
    });

    it('renders Resource Pools heading', async () => {
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        expect(await screen.findByText('Resource Pools')).toBeDefined();
    });

    it('renders pool grouping tabs', async () => {
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        expect(screen.getByText('Pools')).toBeDefined();
        expect(screen.getByText('Providers')).toBeDefined();
    });

    it('renders all four pool config names', async () => {
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        expect(screen.getByText('Fast Compute')).toBeDefined();
        expect(screen.getByText('Balanced')).toBeDefined();
        expect(screen.getByText('Free Tier')).toBeDefined();
        expect(screen.getByText('Experimental')).toBeDefined();
    });

    it('shows No providers in this pool when keys empty', async () => {
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        const emptyMessages = screen.getAllByText('No providers in this pool');
        expect(emptyMessages.length).toBeGreaterThan(0);
    });

    it('switches to providers view on tab click', async () => {
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        const btn = screen.getByText('Providers');
        btn.click();
        expect(await screen.findByText('Quota Cap')).toBeDefined();
    });

    it('renders legacy keys without a provider', async () => {
        poolState.keys = [{ id: 'legacy-1' }];
        const PoolStatusPanel = (await import('./PoolStatusPanel')).default;
        render(<PoolStatusPanel />);
        expect(await screen.findByText('Resource Pools')).toBeDefined();
        expect(document.body.textContent).not.toContain('NaN');
    });

    it('sanitizes quota input to non-negative integers on save', async () => {
        poolState.keys = [
            { id: 'k1', provider: 'groq', status: 'active', label: 'G1' },
        ];
        const Panel = (await import('./PoolStatusPanel')).default;
        const { container } = render(<Panel />);
        fireEvent.click(screen.getByText('Providers'));
        await screen.findByText('Quota Cap');
        fireEvent.click(screen.getByText('Quota'));
        await screen.findByText('Edit Free Tier Quota');
        const inputs = container.querySelectorAll('input[type="number"]');
        expect(inputs.length).toBe(2);
        fireEvent.change(inputs[0]!, { target: { value: 'abc' } });
        fireEvent.change(inputs[1]!, { target: { value: '-5' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() =>
            expect(poolActions.setFreeTierLimit).toHaveBeenCalledWith('groq', {
                requestsPerDay: 0,
                tokensPerDay: 0,
            }),
        );
    });
});
