import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSettings = {
    notifications: true,
    autoHealthCheck: true,
    defaultMode: 'smart' as const,
    streamingEnabled: true,
    historyPersistence: true,
    fallbackEnabled: true,
    debugMode: false,
    theme: 'dark' as const,
    language: 'en' as const,
    explorationFactor: 0.1,
    slaMode: 'BALANCED' as const,
};

const mockCONFIG = {
    buildId: 'dev',
    featureFlags: {
        memory: { enabled: true, semantic: true, ragOnChat: true, autoStore: true },
        debate: { runtimeEngine: true, engineOnly: false },
        ui: { experimentalVisuals: false },
    },
    monitoring: {
        latencyPenalty: { divisor: 2, cap: 5000, thresholdMs: 1000 },
        errorRatePenalty: { multiplier: 2, cap: 0.5, threshold: 0.1 },
        successRatePenalty: { multiplier: 2, floor: 0.5 },
        alertPenalty: { perAlert: 5, cap: 50 },
        healthCheckStaleIntervalMs: 30000,
        healthThresholds: { healthy: 0.9, degraded: 0.5 },
    },
    webhooks: {
        maxRetries: 3,
        retryDelayMs: 1000,
        timeoutMs: 5000,
        discordContentMaxLength: 2000,
        discordEmbedDescMaxLength: 4096,
        providers: ['slack', 'telegram', 'discord'],
        eventOptions: ['key:added', 'key:removed', 'key:health:check:failed'],
    },
};

vi.mock('../../kernel/instances', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
    CONFIG: mockCONFIG,
    settingsService: {
        getSettings: vi.fn(() => ({
            ...mockSettings,
            dataManagement: {
                autoSaveInterval: 30000,
                maxHistoryEntries: 1000,
                maxTraceEntries: 500,
                pruneMemoriesAfterDays: 30,
                exportOnShutdown: false,
            },
            telemetryEnabled: true,
            autoUpdateCheck: true,
        })),
        updateSettings: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        reset: vi.fn(),
    },
    keyService: {
        clearAllData: vi.fn(),
    },
    configService: {
        getMonitoring: vi.fn(() => ({
            healthCheckStaleIntervalMs: 30000,
            latencyPenalty: { thresholdMs: 1000, divisor: 2, cap: 5000 },
            errorRatePenalty: { threshold: 0.1, multiplier: 2, cap: 0.5 },
            successRatePenalty: { floor: 0.5, multiplier: 2 },
            alertPenalty: { perAlert: 5, cap: 50 },
        })),
        getMetrics: vi.fn(() => ({
            maxHistoryPoints: 100,
            autoCaptureIntervalMs: 60000,
        })),
        getTraces: vi.fn(() => ({
            maxEntries: 1000,
            dbLoadLimit: 100,
            tokenEstimateDivisor: 1000,
        })),
        getWebhooks: vi.fn(() => ({
            eventOptions: ['key:added', 'key:removed', 'key:health:check:failed'],
            providers: ['slack', 'telegram', 'discord'],
        })),
        updateMonitoring: vi.fn(),
        updateMetrics: vi.fn(),
        updateTraces: vi.fn(),
    },
    notificationWebhookService: {
        getWebhooks: vi.fn(() => []),
    },
    externalSecretsService: {
        getStatus: vi.fn(() => Promise.resolve([])),
        activateBackend: vi.fn(),
    },
}));

vi.mock('../../kernel/security', () => ({
    securityService: {
        isLocked: vi.fn(() => true),
        initialize: vi.fn(() => Promise.resolve(true)),
    },
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
}));

vi.mock('../../kernel/events/event-names', () => ({
    EVENTS: {
        SETTINGS_UPDATED: 'settings:updated',
        NOTIFICATION: 'notification',
    },
}));

vi.mock('../../i18n/useTranslation', () => {
    const translations: Record<string, string> = {
        'nav.settings': 'Settings',
        'settings.general': 'General Preferences',
        'settings.interaction': 'Interaction & Memory',
        'nav.routing_ai': 'Routing AI',
        'settings.tab.alerts': 'Alerts',
        'settings.notifications': 'System Notifications',
        'settings.tab.prompts': 'Prompts',
        'settings.security': 'Security & Core Access',
        'settings.telemetry': 'OS Telemetry',
        'settings.version_label': 'Version',
        'settings.build_id': 'Build ID',
        'settings.kernel_label': 'Kernel Status',
        'settings.search_placeholder': 'Search settings...',
        'settings.error_update': 'Failed to update setting',
        'settings.error_vault_password': 'Please enter a vault password',
        'settings.error_vault_operation': 'Failed to configure vault',
        'settings.error_save_config': 'Failed to save configuration',
        'settings.reset_confirm': 'Reset all settings to defaults?',
        'settings.reset_success_notification': 'Settings reset to defaults',
        'settings.error_reset': 'Failed to reset settings',
        'settings.purge_confirm': 'Purge all data?',
        'settings.purge_success_notification': 'All data purged',
        'settings.error_purge': 'Failed to purge data',
        'settings.interface_theme': 'Interface Theme',
        'settings.theme_desc': 'Choose your visual theme',
        'settings.theme_dark': 'Dark',
        'settings.theme_light': 'Light',
        'settings.theme_cyberpunk': 'Cyberpunk',
        'settings.theme_nature': 'Nature',
        'settings.theme_ocean': 'Ocean',
        'settings.theme_sunset': 'Sunset',
        'settings.theme_high-contrast': 'High Contrast',
        'settings.high_contrast': 'High Contrast Mode',
        'settings.high_contrast_desc': 'Increase contrast for better visibility',
        'settings.language': 'System Language',
        'settings.language_desc': 'Choose interface language',
        'settings.lang_en': 'English',
        'settings.lang_ru': 'Russian',
        'settings.notifications_desc': 'Enable system notifications',
        'settings.feature_flags': 'Feature Flags',
        'settings.memory_system': 'Memory System',
        'settings.memory_system_desc': 'Enable the memory system',
        'settings.semantic_search': 'Semantic Search',
        'settings.semantic_search_desc': 'Enable semantic search across memories',
        'settings.rag_on_chat': 'RAG on Chat',
        'settings.rag_on_chat_desc': 'Augment chat with relevant memories',
        'settings.auto_store_memory': 'Auto-Store Memory',
        'settings.auto_store_memory_desc': 'Automatically store chat memories',
        'settings.debate_runtime_engine': 'Debate Runtime Engine',
        'settings.debate_runtime_engine_desc': 'Use the new debate runtime engine',
        'settings.chat_strategy': 'Default Chat Strategy',
        'settings.chat_strategy_desc': 'Default chat routing strategy',
        'settings.chat_strategy_aria': 'Default chat strategy',
        'settings.strategy_auto': 'Auto (Smart)',
        'settings.strategy_swarm': 'Broadcast (Swarm)',
        'settings.strategy_fixed': 'Single (Fixed)',
        'settings.streaming': 'Streaming Responses',
        'settings.streaming_desc': 'Stream responses in real-time',
        'settings.history': 'History Persistence',
        'settings.history_desc': 'Persist chat history across sessions',
        'settings.router_title': 'Reinforcement Router (UCB1)',
        'settings.router_desc': 'Adjust exploration vs exploitation balance',
        'settings.exploration_aria': 'Exploration factor',
        'settings.exploration_greedy': 'Greedy',
        'settings.exploration_explore': 'Explore',
        'settings.exploration_balanced': 'Balanced',
        'settings.fallback': 'Fallback Routing',
        'settings.fallback_desc': 'Fallback to alternative providers on failure',
        'settings.auto_health': 'Auto Health Check',
        'settings.auto_health_desc': 'Automatically check provider health',
        'settings.fallback_chains': 'Fallback Chains',
        'settings.model_downgrade': 'Model Downgrade Chains',
        'settings.system': 'System',
        'settings.restart_desc': 'Restart the application to apply changes',
        'settings.restart_aria': 'Restart system',
        'settings.restart_button': 'Restart System',
        'settings.vault_title': 'Vault Master Key',
        'settings.vault_desc': 'Master encryption key for secure storage',
        'settings.vault_password_aria': 'Enter vault password',
        'settings.vault_set_password': 'Set Vault Password',
        'settings.vault_set_password_aria': 'Set vault password',
        'settings.secrets_backends': 'Secrets Backends',
        'settings.secrets_backends_desc': 'Active backend: {backend}',
        'settings.hide': 'Hide',
        'settings.manage': 'Manage',
        'settings.no_backends': 'No backends configured',
        'settings.activate': 'Activate',
        'settings.debug': 'Debug Mode',
        'settings.debug_desc': 'Enable debug logging and diagnostics',
        'settings.reset_title': 'Reset Settings',
        'settings.reset_desc': 'Restore all settings to factory defaults',
        'settings.reset_aria': 'Reset settings to defaults',
        'settings.reset_button': 'Reset',
        'settings.factory_reset': 'Factory Reset',
        'settings.factory_reset_desc': 'Purge all data and reset to factory state',
        'settings.factory_aria': 'Factory reset all data',
        'settings.factory_button': 'Purge All Data',
        'settings.runtime_config': 'Runtime Configuration',
        'settings.monitoring': 'Monitoring',
        'settings.health_stale_interval': 'Health Check Stale Interval (ms)',
        'settings.latency_penalty_threshold': 'Latency Penalty Threshold (ms)',
        'settings.error_rate_penalty': 'Error Rate Penalty Threshold',
        'settings.success_rate_penalty': 'Success Rate Penalty Floor',
        'settings.alert_penalty': 'Alert Penalty per Alert',
        'settings.metrics': 'Metrics',
        'settings.history_limit': 'History Limit (points)',
        'settings.collection_interval': 'Collection Interval (ms)',
        'settings.traces_label': 'Traces',
        'settings.max_entries': 'Max Entries',
        'settings.db_load_limit': 'DB Load Limit',
        'settings.token_estimate_divisor': 'Token Estimate Divisor',
        'settings.save_config': 'Save Configuration',
        'common.not_available': 'N/A',
        'common.active': 'Active',
    };
    return {
        useTranslation: () => ({
            t: (key: string, params?: Record<string, string | number>) => {
                let text = translations[key] || key;
                if (params) {
                    for (const [k, v] of Object.entries(params)) {
                        text = text.replace(`{${k}}`, String(v));
                    }
                }
                return text;
            },
            lang: 'en',
        }),
    };
});

function getTab(name: string) {
    return screen.getByRole('tab', { name });
}

describe('SettingsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Settings heading', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        const heading = await screen.findByRole(
            'heading',
            { name: /Settings/i },
            { timeout: 10000 },
        );
        expect(heading).toBeDefined();
    }, 15000);

    it('renders navigation tabs', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        const tabNames = screen.getAllByRole('tab').map((t) => t.textContent?.trim());
        expect(tabNames).toContain('General Preferences');
        expect(tabNames).toContain('Interaction & Memory');
        expect(tabNames).toContain('Routing AI');
        expect(tabNames).toContain('Security & Core Access');
    }, 15000);

    it('shows General Preferences by default', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        expect(screen.getAllByText('General Preferences').length).toBeGreaterThan(0);
        expect(screen.getByText('Interface Theme')).toBeDefined();
        expect(screen.getByText('System Language')).toBeDefined();
        expect(screen.getAllByText('System Notifications').length).toBeGreaterThan(0);
    }, 15000);

    it('switches to Interaction & Memory tab', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        fireEvent.click(getTab('Interaction & Memory'));
        expect(await screen.findByText('Default Chat Strategy')).toBeDefined();
        expect(screen.getByText('Streaming Responses')).toBeDefined();
        expect(screen.getByText('History Persistence')).toBeDefined();
    }, 15000);

    it('switches to Routing AI tab', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        fireEvent.click(getTab('Routing AI'));
        expect(await screen.findByText('Reinforcement Router (UCB1)')).toBeDefined();
        expect(screen.getByText('Fallback Routing')).toBeDefined();
        expect(screen.getByText('Auto Health Check')).toBeDefined();
    }, 15000);

    it('switches to Security & Core Access tab', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        fireEvent.click(getTab('Security & Core Access'));
        expect(await screen.findByText('Secrets Backends')).toBeDefined();
        expect(screen.getByText('Debug Mode')).toBeDefined();
        expect(screen.getByText('Reset Settings')).toBeDefined();
        expect(screen.getByText('Factory Reset')).toBeDefined();
    }, 15000);

    it('shows OS Telemetry sidebar section', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        expect(await screen.findByText('OS Telemetry', {}, { timeout: 10000 })).toBeDefined();
    }, 15000);

    it('renders theme select dropdown', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByText('Interface Theme', {}, { timeout: 10000 });
        const selects = document.querySelectorAll('select');
        expect(selects.length).toBeGreaterThanOrEqual(1);
    }, 15000);

    it('renders toggle switch for notifications', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findAllByText('System Notifications', {}, { timeout: 10000 });
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
    }, 15000);

    it('renders exploration factor slider in Routing AI', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        await screen.findByRole('tab', { name: /General Preferences/i }, { timeout: 10000 });
        fireEvent.click(getTab('Routing AI'));
        await screen.findByText('Reinforcement Router (UCB1)');
        const sliders = document.querySelectorAll('input[type="range"]');
        expect(sliders.length).toBeGreaterThan(0);
    }, 15000);

    it('shows version info in sidebar', async () => {
        const SettingsPanel = (await import('./SettingsPanel')).default;
        render(<SettingsPanel />);
        expect(await screen.findByText(/v0\.0\.0/, {}, { timeout: 10000 })).toBeDefined();
        expect(screen.getByText('dev')).toBeDefined();
        expect(screen.getByText('HEALTHY')).toBeDefined();
    }, 15000);
});
