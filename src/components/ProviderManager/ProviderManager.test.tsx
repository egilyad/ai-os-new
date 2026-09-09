import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { FC } from 'react';
import type { ApiKey } from '../../types/metrics';

interface InstalledProvidersViewProps {
    keys: ApiKey[];
    onSelect: (key: ApiKey, tab: 'overview' | 'sandbox') => void;
    onCheckHealth: (keyId: string) => void;
    onToggleStatus: (keyId: string) => void;
    onRemoveKey: (keyId: string) => void;
    onEnableAll: () => void;
    onDisableAll: () => void;
    checkingIds: Set<string>;
}

interface RoutingSLAViewProps {
    keys: ApiKey[];
}

interface BrowseModelsViewProps {
    onAddProvider: () => void;
}

interface ProviderDetailModalProps {
    profile: ApiKey;
    initialTab: 'overview' | 'sandbox';
    onClose: () => void;
    onCheckHealth: (id: string) => void;
    onRemove: (id: string) => void;
    checkingKeys?: Set<string>;
}

interface ProviderIconProps {
    provider: string;
    size?: number;
    className?: string;
}

const mockKeys = vi.hoisted((): ApiKey[] => [
    {
        id: 'k1',
        provider: 'OpenRouter',
        key: 'sk-or-1',
        label: 'OpenRouter Pro',
        status: 'active',
        availableModels: ['gpt-4'],
        stats: {
            successCount: 50,
            errorCount: 2,
            totalTokens: 10000,
            avgLatency: 1200,
            minLatency: 800,
            maxLatency: 2000,
        },
    } as ApiKey,
    {
        id: 'k2',
        provider: 'Gemini',
        key: 'sk-gem-1',
        label: 'Gemini Pro',
        status: 'error',
        availableModels: ['gemini-pro'],
        stats: {
            successCount: 10,
            errorCount: 5,
            totalTokens: 2000,
            avgLatency: 800,
            minLatency: 600,
            maxLatency: 1200,
        },
    } as ApiKey,
]);

const keyStoreState = vi.hoisted(() => ({
    keys: [] as unknown as ApiKey[],
    activeKeys: [] as ApiKey[],
    checkingIds: new Set<string>(),
    alerts: [] as ApiKey[],
    removeKey: vi.fn(),
    checkHealth: vi.fn(),
    checkAllHealth: vi.fn(),
    toggleKeyStatus: vi.fn(),
    enableAllKeys: vi.fn(),
    disableAllKeys: vi.fn(),
    exportKeys: vi.fn(() => Promise.resolve('')),
    importKeys: vi.fn(() => Promise.resolve(0)),
    updateKey: vi.fn(),
    addKey: vi.fn(),
    getKeyById: vi.fn(),
    getKeysByProvider: vi.fn(() => []),
    getAlerts: vi.fn(() => []),
    resolveAlert: vi.fn(),
    totalKeys: 0,
    activeCount: 0,
    errorCount: 0,
}));

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: vi.fn((selector?: (s: typeof keyStoreState) => unknown) => {
        if (typeof selector === 'function') return selector(keyStoreState);
        return keyStoreState;
    }),
}));

vi.mock('../../kernel/instances', () => ({
    rootLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    EVENTS: {
        KEYS_LOADED: 'key:loaded',
        KEY_ADDED: 'key:added',
        KEY_REMOVED: 'key:removed',
        CHECK_HEALTH: 'health:check',
        CHECK_ALL_HEALTH: 'health:check_all',
    },
    settingsService: {
        getSettings: () => ({ language: 'en' as const, theme: 'dark' as const }),
        subscribe: () => () => {},
    },
    probeService: {},
    keyStateStore: {},
    adapterRegistry: {
        getAllProviders: () => ['openrouter', 'gemini', 'groq', 'nvidia'],
    },
    groupManager: {
        createKey: vi.fn(() => Promise.resolve({ ok: true, key: {} })),
    },
    FREE_TIER_LIMITS: { maxKeys: 100, maxRequests: 10000 },
    keyService: {
        getRoutingPolicy: () => ({ globalSLAMode: 'BALANCED', latencyThreshold: 2000 }),
        setGlobalSLA: vi.fn(),
        setLatencyThreshold: vi.fn(),
        setSLA: vi.fn(),
        getProviderIntrospection: vi.fn(() => Promise.resolve({})),
        getAlerts: vi.fn(() => []),
    },
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    EVENTS: {
        KEYS_LOADED: 'key:loaded',
        KEY_ADDED: 'key:added',
        KEY_REMOVED: 'key:removed',
        CHECK_HEALTH: 'health:check',
        CHECK_ALL_HEALTH: 'health:check_all',
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => {
        const map: Record<string, string> = {
            'provider_manager.title': 'AI Providers',
            'provider_manager.empty_state': 'Add your first provider key to get started',
            'provider_manager.check_all_health': 'Check All Health',
            'provider_manager.add_custom_provider': 'Add Custom Provider',
            'provider_manager.tab.installed': 'Installed',
            'provider_manager.tab.browse_models': 'Browse Models',
            'provider_manager.tab.routing_sla': 'Routing & SLA',
            'provider_manager.tab.resource_pools': 'Resource Pools',
            'provider_manager.tab.routing_intel': 'Routing Intelligence',
            'provider_manager.aria.export': 'Export providers',
            'provider_manager.aria.import': 'Import providers',
            'common.export': 'Export',
            'common.import': 'Import',
            'common.cancel': 'Cancel',
            'common.error': 'Error',
            'common.notes': 'Notes',
            'common.save': 'Save',
            'common.close': 'Close',
            'common.aria.close_details': 'Close provider details',
            'common.search': 'Search...',
            'common.loading': 'Loading...',
            'common.switch_to_dark': 'Switch to dark mode',
            'common.switch_to_light': 'Switch to light mode',
            'common.toggle_theme': 'Toggle theme',
            'provider.search_placeholder': 'Search installed providers...',
            'provider.table_view': 'Table',
            'provider.card_view': 'Cards',
            'provider.quick_test_all': 'Quick Test All',
            'provider.enable_all': 'Enable All',
            'provider.disable_all': 'Disable All',
            'provider.filter_all': 'All',
            'provider.all_groups': 'All Groups',
            'provider.quick_test_results': 'Quick Test Results',
            'provider.no_response': 'No response',
            'provider.no_providers_found': 'No providers found',
            'provider.try_different_search': 'Try a different search',
            'provider.add_provider_to_start': 'Add a provider to start',
            'provider.check_health': 'Check Health',
            'provider.checking_health': 'Checking health...',
            'provider.disable': 'Disable',
            'provider.enable': 'Enable',
            'provider.tooltip_quick_test': 'Quick Test',
            'provider.tooltip_confirm_remove': 'Confirm remove',
            'provider.tooltip_remove': 'Remove',
            'provider.tooltip_probe': 'Quick Probe',
            'provider.tooltip_open_sandbox': 'Open Sandbox',
            'provider.confirm_remove': 'Remove this key?',
            'provider.tokens_short': 'Tokens',
            'provider.requests_short': 'Req',
            'provider.select_model': 'Select model',
            'provider.default_model': 'Auto',
            'provider.latency_label': 'Latency',
            'provider.tps_label': 'TPS',
            'provider.reliability_label': 'Reliability',
            'provider.expired': 'Expired',
            'provider.expires': 'Expires',
            'provider.quick_test': 'Quick Test',
            'provider.enter_prompt': 'Type a prompt...',
            'provider.status.active': 'Active',
            'provider.status.error': 'Error',
            'provider.status.inactive': 'Inactive',
            'provider.status.checking': 'Checking',
            'provider.status.pending': 'Pending',
            'provider.status.quota_exhausted': 'Quota Exhausted',
            'provider.status.invalid': 'Invalid',
            'provider.status.duplicate': 'Duplicate',
            'provider.status.quarantined': 'Quarantined',
            'provider.status.probation': 'Probation',
            'provider.status.unknown': 'Unknown',
            'provider.column.provider': 'Provider',
            'provider.column.status': 'Status',
            'provider.column.quota': 'Quota',
            'provider.column.group': 'Group',
            'provider.column.account': 'Account',
            'provider.column.latency': 'Latency',
            'provider.column.tps': 'TPS',
            'provider.column.reliability': 'Reliability',
            'provider.column.reputation': 'Reputation',
            'provider.column.models': 'Models',
            'provider.column.notes': 'Notes',
            'provider.column.tags': 'Tags',
            'provider.test_prompt_placeholder': 'Test {label}...',
        };
        return {
            t: (key: string, params?: Record<string, string | number>): string => {
                let result = map[key] ?? key;
                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        result = result.replace(`{${k}}`, String(v));
                    }
                }
                return result;
            },
            lang: 'en',
        };
    },
}));

describe('ProviderManager', () => {
    let ProviderManager: FC;

    beforeAll(async () => {
        ProviderManager = (await import('./ProviderManager')).default;
    }, 30000);

    beforeEach(() => {
        vi.clearAllMocks();
        keyStoreState.keys = [...mockKeys];
        keyStoreState.activeKeys = mockKeys.filter((k) => k.status === 'active');
        keyStoreState.totalKeys = mockKeys.length;
        keyStoreState.activeCount = mockKeys.filter((k) => k.status === 'active').length;
        keyStoreState.errorCount = mockKeys.filter((k) => k.status === 'error').length;
    });

    it('renders without crashing', () => {
        const { container } = render(<ProviderManager />);
        expect(container).toBeDefined();
    });

    it('shows heading and description', () => {
        render(<ProviderManager />);
        expect(screen.getByText('AI Providers')).toBeDefined();
        expect(screen.getByText(/1 active/)).toBeDefined();
    });

    it('shows tab buttons', () => {
        render(<ProviderManager />);
        expect(screen.getByText('Installed (2)')).toBeDefined();
        expect(screen.getByText('Browse Models')).toBeDefined();
        expect(screen.getByText('Routing & SLA')).toBeDefined();
    });

    it('shows Add Custom Provider button', () => {
        render(<ProviderManager />);
        expect(screen.getByText('Add Custom Provider')).toBeDefined();
    });

    it('shows Check All Health button', () => {
        render(<ProviderManager />);
        expect(screen.getByText('Check All Health')).toBeDefined();
    });

    it('sets aria-selected on active tab', () => {
        render(<ProviderManager />);
        const installedTab = screen.getByText('Installed (2)').closest('button')!;
        expect(installedTab.getAttribute('aria-selected')).toBe('true');
    });

    it('switches to Browse Models tab on click', async () => {
        render(<ProviderManager />);
        fireEvent.click(screen.getByText('Browse Models'));
        await waitFor(() => expect(screen.getByText('OpenRouter')).toBeDefined());
    });

    it('switches to Routing & SLA tab on click', async () => {
        render(<ProviderManager />);
        fireEvent.click(screen.getByText('Routing & SLA'));
        await waitFor(() => expect(screen.getByText('Global Routing Policy')).toBeDefined());
    });

    it('navigates tabs with ArrowRight key', () => {
        render(<ProviderManager />);
        const tablist = screen.getByRole('tablist');
        fireEvent.keyDown(tablist, { key: 'ArrowRight' });
        expect(screen.queryByRole('tab', { selected: true })?.textContent).toMatch(/Browse Models/);
    });

    it('navigates tabs with ArrowLeft key', () => {
        render(<ProviderManager />);
        const tablist = screen.getByRole('tablist');
        fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
        expect(screen.queryByRole('tab', { selected: true })?.textContent).toMatch(/Routing Intel/);
    });

    it('shows provider table with key labels', () => {
        render(<ProviderManager />);
        expect(screen.getByText('OpenRouter Pro')).toBeDefined();
        expect(screen.getByText('Gemini Pro')).toBeDefined();
    });

    it('shows empty state description when no keys', () => {
        keyStoreState.keys = [];
        keyStoreState.activeKeys = [];
        keyStoreState.totalKeys = 0;
        keyStoreState.activeCount = 0;
        keyStoreState.errorCount = 0;
        render(<ProviderManager />);
        expect(screen.getByText((content) => content.includes('Add your first'))).toBeDefined();
    });
});

describe('InstalledProvidersView', () => {
    let InstalledProvidersView: FC<InstalledProvidersViewProps>;

    beforeAll(async () => {
        InstalledProvidersView = (await import('./InstalledProvidersView')).default;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const baseProps: InstalledProvidersViewProps = {
        keys: mockKeys,
        onSelect: vi.fn(),
        onCheckHealth: vi.fn(),
        onToggleStatus: vi.fn(),
        onRemoveKey: vi.fn(),
        onEnableAll: vi.fn(),
        onDisableAll: vi.fn(),
        checkingIds: new Set<string>(),
    };

    it('renders search input', () => {
        render(<InstalledProvidersView {...baseProps} />);
        expect(screen.getByPlaceholderText('Search installed providers...')).toBeDefined();
    });

    it('filters providers on search', async () => {
        render(<InstalledProvidersView {...baseProps} />);
        const input = screen.getByPlaceholderText('Search installed providers...');
        fireEvent.change(input, { target: { value: 'Gemini' } });
        await waitFor(() => {
            expect(screen.getByText((_, el) => el?.textContent === 'Gemini Pro')).toBeDefined();
        });
        await waitFor(() => {
            expect(screen.queryByText((_, el) => el?.textContent === 'OpenRouter Pro')).toBeNull();
        });
    });

    it('shows empty state when no matches', async () => {
        render(<InstalledProvidersView {...baseProps} />);
        const input = screen.getByPlaceholderText('Search installed providers...');
        fireEvent.change(input, { target: { value: 'nonexistent' } });
        await waitFor(() => {
            expect(screen.getByText('No providers found')).toBeDefined();
        });
    });

    it('shows view mode toggles', () => {
        render(<InstalledProvidersView {...baseProps} />);
        expect(screen.getByText('Table')).toBeDefined();
        expect(screen.getByText('Cards')).toBeDefined();
    });

    it('switches to cards view', () => {
        render(<InstalledProvidersView {...baseProps} />);
        fireEvent.click(screen.getByText('Cards'));
        expect(screen.getByText('1200ms')).toBeDefined();
    });

    it('calls onSelect when row clicked', () => {
        const onSelect = vi.fn();
        render(<InstalledProvidersView {...baseProps} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('OpenRouter Pro'));
        expect(onSelect).toHaveBeenCalledWith(mockKeys[0], 'overview');
    });

    it('calls onSelect on Enter key on row', () => {
        const onSelect = vi.fn();
        render(<InstalledProvidersView {...baseProps} onSelect={onSelect} />);
        const row = screen.getByText('OpenRouter Pro').closest('tr')!;
        fireEvent.keyDown(row, { key: 'Enter' });
        expect(onSelect).toHaveBeenCalledWith(mockKeys[0], 'overview');
    });

    it('calls onSelect on Space key on row', () => {
        const onSelect = vi.fn();
        render(<InstalledProvidersView {...baseProps} onSelect={onSelect} />);
        const row = screen.getByText('OpenRouter Pro').closest('tr')!;
        fireEvent.keyDown(row, { key: ' ' });
        expect(onSelect).toHaveBeenCalledWith(mockKeys[0], 'overview');
    });

    it('calls onCheckHealth when health button clicked in table', () => {
        const onCheckHealth = vi.fn();
        render(<InstalledProvidersView {...baseProps} onCheckHealth={onCheckHealth} />);
        const healthBtns = screen.getAllByTitle('Check Health');
        fireEvent.click(healthBtns[1]);
        expect(onCheckHealth).toHaveBeenCalledWith('k1');
    });

    it('calls onCheckHealth when health button clicked in card view', () => {
        const onCheckHealth = vi.fn();
        render(<InstalledProvidersView {...baseProps} onCheckHealth={onCheckHealth} />);
        fireEvent.click(screen.getByText('Cards'));
        const healthBtns = screen.getAllByTitle('Check Health');
        fireEvent.click(healthBtns[1]);
        expect(onCheckHealth).toHaveBeenCalledWith('k1');
    });

    it('shows em dash for missing TPS', () => {
        render(
            <InstalledProvidersView
                {...baseProps}
                keys={[
                    {
                        ...mockKeys[1],
                        stats: {
                            successCount: 0,
                            errorCount: 0,
                            totalTokens: 0,
                            avgLatency: 0,
                            minLatency: 0,
                            maxLatency: 0,
                        },
                    },
                ]}
            />,
        );
        const tpsCells = screen.getAllByText('\u2014');
        expect(tpsCells.length).toBeGreaterThan(0);
    });

    it('stops propagation on action button click', () => {
        const onSelect = vi.fn();
        const onCheckHealth = vi.fn();
        render(
            <InstalledProvidersView
                {...baseProps}
                onSelect={onSelect}
                onCheckHealth={onCheckHealth}
            />,
        );
        const healthBtns = screen.getAllByTitle('Check Health');
        fireEvent.click(healthBtns[0]);
        expect(onSelect).not.toHaveBeenCalled();
    });
});

describe('RoutingSLAView', () => {
    let RoutingSLAView: FC<RoutingSLAViewProps>;

    beforeAll(async () => {
        RoutingSLAView = (await import('./RoutingSLAView')).default;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders global routing policy section', () => {
        render(<RoutingSLAView keys={mockKeys} />);
        expect(screen.getByText('Global Routing Policy')).toBeDefined();
        expect(screen.getByText('Active Provider SLAs')).toBeDefined();
    });

    it('renders active provider SLA cards', () => {
        render(<RoutingSLAView keys={mockKeys} />);
        expect(screen.getByText('OpenRouter Pro')).toBeDefined();
        expect(screen.queryByText('Gemini Pro')).toBeNull();
    });

    it('shows no-active-providers message when none active', () => {
        render(<RoutingSLAView keys={[]} />);
        expect(screen.getByText('No active providers to monitor.')).toBeDefined();
    });

    it('toggles fallback switch on click', () => {
        render(<RoutingSLAView keys={mockKeys} />);
        const toggle = screen.getByRole('switch');
        expect(toggle.getAttribute('aria-checked')).toBe('true');
        fireEvent.click(toggle);
        expect(toggle.getAttribute('aria-checked')).toBe('false');
        fireEvent.click(toggle);
        expect(toggle.getAttribute('aria-checked')).toBe('true');
    });

    it('toggles fallback switch on Enter key', () => {
        render(<RoutingSLAView keys={mockKeys} />);
        const toggle = screen.getByRole('switch');
        fireEvent.keyDown(toggle, { key: 'Enter' });
        expect(toggle.getAttribute('aria-checked')).toBe('false');
    });

    it('updates latency threshold slider', () => {
        render(<RoutingSLAView keys={mockKeys} />);
        const slider = screen.getByLabelText('Latency threshold');
        fireEvent.change(slider, { target: { value: '3000' } });
        expect(screen.getByText('3000ms')).toBeDefined();
    });
});

describe('BrowseModelsView', () => {
    let BrowseModelsView: FC<BrowseModelsViewProps>;

    beforeAll(async () => {
        BrowseModelsView = (await import('./BrowseModelsView')).default;
    });

    it('renders provider catalog cards', () => {
        render(<BrowseModelsView onAddProvider={vi.fn()} />);
        expect(screen.getByText('OpenRouter')).toBeDefined();
        expect(screen.getByText('Gemini')).toBeDefined();
        expect(screen.getByText('Groq')).toBeDefined();
        expect(screen.getByText('NVIDIA')).toBeDefined();
    });

    it('calls onAddProvider on configure button click', () => {
        const onAddProvider = vi.fn();
        render(<BrowseModelsView onAddProvider={onAddProvider} />);
        fireEvent.click(screen.getByText('Configure OpenRouter'));
        expect(onAddProvider).toHaveBeenCalledOnce();
    });
});

describe('ProviderIcon', () => {
    let ProviderIcon: FC<ProviderIconProps>;

    beforeAll(async () => {
        ProviderIcon = (await import('../ProviderIcon/ProviderIcon')).default;
    });

    it('renders with default size', () => {
        const { container } = render(<ProviderIcon provider="OpenRouter" />);
        expect(container.querySelector('.provider-icon-wrapper')).toBeDefined();
    });

    it('renders with custom size', () => {
        const { container } = render(<ProviderIcon provider="Gemini" size={32} />);
        expect(container.querySelector('.provider-icon-wrapper')).toBeDefined();
    });
});

describe('ProviderDetailModal', () => {
    let ProviderDetailModal: FC<ProviderDetailModalProps>;
    const profile = mockKeys[0];

    beforeAll(async () => {
        ProviderDetailModal = (await import('./ProviderDetailModal')).default;
    });

    const baseProps: ProviderDetailModalProps = {
        profile,
        initialTab: 'overview',
        onClose: vi.fn(),
        onCheckHealth: vi.fn(),
        onRemove: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders provider details', () => {
        render(<ProviderDetailModal {...baseProps} />);
        expect(screen.getByText('OpenRouter Pro')).toBeDefined();
        expect(screen.getByText('OpenRouter')).toBeDefined();
        expect(screen.getByText('Run Health Check')).toBeDefined();
        expect(screen.getByText('Remove Provider')).toBeDefined();
    });

    it('has dialog role and aria-modal', () => {
        render(<ProviderDetailModal {...baseProps} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('calls onClose when X button clicked', () => {
        const onClose = vi.fn();
        render(<ProviderDetailModal {...baseProps} onClose={onClose} />);
        fireEvent.click(screen.getByLabelText('Close provider details'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Close button clicked', () => {
        const onClose = vi.fn();
        render(<ProviderDetailModal {...baseProps} onClose={onClose} />);
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes on Escape key', () => {
        const onClose = vi.fn();
        render(<ProviderDetailModal {...baseProps} onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('shows Confirm Remove after first click on Remove Provider', () => {
        render(<ProviderDetailModal {...baseProps} />);
        fireEvent.click(screen.getByText('Remove Provider'));
        expect(screen.getByText('Confirm Remove')).toBeDefined();
    });

    it('calls onRemove and onClose after confirming remove', () => {
        const onRemove = vi.fn();
        const onClose = vi.fn();
        render(<ProviderDetailModal {...baseProps} onRemove={onRemove} onClose={onClose} />);
        fireEvent.click(screen.getByText('Remove Provider'));
        fireEvent.click(screen.getByText('Confirm Remove'));
        expect(onRemove).toHaveBeenCalledWith('k1');
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('cancels remove on Escape when in confirm state', () => {
        render(<ProviderDetailModal {...baseProps} />);
        fireEvent.click(screen.getByText('Remove Provider'));
        expect(screen.getByText('Confirm Remove')).toBeDefined();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByText('Confirm Remove')).toBeNull();
    });

    it('calls onCheckHealth when health check clicked', () => {
        const onCheckHealth = vi.fn();
        render(<ProviderDetailModal {...baseProps} onCheckHealth={onCheckHealth} />);
        fireEvent.click(screen.getByText('Run Health Check'));
        expect(onCheckHealth).toHaveBeenCalledWith('k1');
    });

    it('closes on backdrop click', () => {
        const onClose = vi.fn();
        render(<ProviderDetailModal {...baseProps} onClose={onClose} />);
        const backdrop = document.querySelector('.provider-modal-backdrop')!;
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });
});
