import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import { withTransaction } from '../utils/with-transaction';
import type {
    ThemeConfig,
    NotificationPreferences,
    DataManagementSettings,
    SystemSettings,
    ISettingsService,
} from '../contracts/settings';

const LOGGER = rootLogger.child('SettingsService');

export type {
    ThemeConfig,
    NotificationPreferences,
    DataManagementSettings,
    SystemSettings,
} from '../contracts/settings';

export interface SettingsProfile {
    id: string;
    name: string;
    description: string;
    settings: SystemSettings;
    created: number;
}

export type SettingsListener = (settings: SystemSettings) => void;

export interface SettingsServiceDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    routerService: {
        setStrategy: (strategy: string) => void;
    };
    kernel: {
        setExplorationFactor: (val: number) => void;
        setSLAMode: (mode: string) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

const SETTINGS_KEY = 'super_agents_os_settings';
const PROFILES_KEY = 'super_agents_settings_profiles';

const DEFAULT_THEME_CONFIG: ThemeConfig = {
    mode: 'dark',
    primaryColor: '#3b82f6',
    accentColor: '#a855f7',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 12,
    reducedMotion: false,
    highContrast: false,
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
    enabled: true,
    healthAlerts: true,
    routingDecisions: false,
    policyViolations: true,
    agentEvents: false,
    errorsOnly: false,
    soundEnabled: false,
};

const DEFAULT_DATA_MANAGEMENT: DataManagementSettings = {
    autoSaveInterval: 10000,
    maxHistoryEntries: 500,
    maxTraceEntries: 200,
    pruneMemoriesAfterDays: 30,
    exportOnShutdown: false,
};

const DEFAULTS: SystemSettings = {
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
    themeConfig: DEFAULT_THEME_CONFIG,
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    dataManagement: DEFAULT_DATA_MANAGEMENT,
    sidebarCollapsed: false,
    telemetryEnabled: true,
    autoUpdateCheck: true,
    fallbackChains: {
        free_first: [
            { provider: 'groq', model: 'llama-3.3-70b-versatile' },
            { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
            { provider: 'openrouter', model: PROVIDER_DEFAULT_MODELS.openrouter },
        ],
        cost: [{ provider: 'groq' }, { provider: 'gemini' }, { provider: 'openrouter' }],
        default: [{ provider: 'groq' }, { provider: 'gemini' }, { provider: 'openai' }],
    },
    modelDowngradeChains: {
        'gpt-4o': ['gpt-4o-mini', 'gpt-3.5-turbo'],
        'claude-3.5-sonnet': ['claude-3-haiku'],
        'gemini-3.1-flash-lite': ['gemini-3.1-flash-lite'],
    },
};

type RoutingStrategy =
    | 'broadcast'
    | 'performance'
    | 'reliability'
    | 'latency'
    | 'auto'
    | 'race'
    | 'cost'
    | 'free_first'
    | 'content';

function mapDefaultModeToStrategy(mode: SystemSettings['defaultMode']): RoutingStrategy {
    return mode === 'smart' ? 'auto' : mode === 'single' ? 'performance' : 'broadcast';
}

function isValidThemeConfig(v: unknown): v is ThemeConfig {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return (
        (o.mode === 'dark' || o.mode === 'light') &&
        typeof o.primaryColor === 'string' &&
        typeof o.accentColor === 'string' &&
        typeof o.fontFamily === 'string' &&
        typeof o.borderRadius === 'number' &&
        typeof o.reducedMotion === 'boolean' &&
        typeof o.highContrast === 'boolean'
    );
}

function isValidNotificationPrefs(v: unknown): v is NotificationPreferences {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return (
        typeof o.enabled === 'boolean' &&
        typeof o.healthAlerts === 'boolean' &&
        typeof o.routingDecisions === 'boolean' &&
        typeof o.policyViolations === 'boolean' &&
        typeof o.agentEvents === 'boolean' &&
        typeof o.errorsOnly === 'boolean' &&
        typeof o.soundEnabled === 'boolean'
    );
}

function isValidDataManagement(v: unknown): v is DataManagementSettings {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return (
        typeof o.autoSaveInterval === 'number' &&
        typeof o.maxHistoryEntries === 'number' &&
        typeof o.maxTraceEntries === 'number' &&
        typeof o.pruneMemoriesAfterDays === 'number' &&
        typeof o.exportOnShutdown === 'boolean'
    );
}

function validateSettings(updates: Partial<SystemSettings>): Partial<SystemSettings> {
    const valid: Partial<SystemSettings> = {};
    if (updates.notifications !== undefined) valid.notifications = updates.notifications;
    if (updates.autoHealthCheck !== undefined) valid.autoHealthCheck = updates.autoHealthCheck;
    if (
        updates.defaultMode !== undefined &&
        ['broadcast', 'single', 'smart'].includes(updates.defaultMode)
    ) {
        valid.defaultMode = updates.defaultMode;
    }
    if (updates.streamingEnabled !== undefined) valid.streamingEnabled = updates.streamingEnabled;
    if (updates.historyPersistence !== undefined)
        valid.historyPersistence = updates.historyPersistence;
    if (updates.fallbackEnabled !== undefined) valid.fallbackEnabled = updates.fallbackEnabled;
    if (updates.debugMode !== undefined) valid.debugMode = updates.debugMode;
    if (
        updates.theme !== undefined &&
        ['dark', 'light', 'cyberpunk', 'nature', 'ocean', 'sunset', 'high-contrast'].includes(
            updates.theme,
        )
    )
        valid.theme = updates.theme;
    if (updates.language !== undefined && ['en', 'ru'].includes(updates.language))
        valid.language = updates.language;
    if (updates.explorationFactor !== undefined) {
        valid.explorationFactor = Math.max(0, Math.min(0.5, updates.explorationFactor));
    }
    if (
        updates.slaMode !== undefined &&
        ['LOW_LATENCY', 'HIGH_QUALITY', 'BALANCED', 'ECONOMY', 'FREE_FIRST'].includes(
            updates.slaMode,
        )
    ) {
        valid.slaMode = updates.slaMode;
    }
    if (updates.fallbackChains !== undefined) valid.fallbackChains = updates.fallbackChains;
    if (updates.modelDowngradeChains !== undefined)
        valid.modelDowngradeChains = updates.modelDowngradeChains;
    if (isValidThemeConfig(updates.themeConfig)) valid.themeConfig = updates.themeConfig;
    if (isValidNotificationPrefs(updates.notificationPrefs))
        valid.notificationPrefs = updates.notificationPrefs;
    if (isValidDataManagement(updates.dataManagement))
        valid.dataManagement = updates.dataManagement;
    if (updates.sidebarCollapsed !== undefined) valid.sidebarCollapsed = updates.sidebarCollapsed;
    if (updates.telemetryEnabled !== undefined) valid.telemetryEnabled = updates.telemetryEnabled;
    if (updates.autoUpdateCheck !== undefined) valid.autoUpdateCheck = updates.autoUpdateCheck;
    return valid;
}

const MAX_PROFILES = 50;

export class SettingsService implements ISettingsService {
    private deps: SettingsServiceDeps;
    private settings: SystemSettings = { ...DEFAULTS };
    private profiles: SettingsProfile[] = [];
    private listeners: Set<SettingsListener> = new Set();
    private _initialized = false;

    constructor(deps: SettingsServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
        await this.loadProfiles();
    }

    private deepMergeSettings(
        defaults: SystemSettings,
        saved: Partial<SystemSettings>,
    ): SystemSettings {
        return {
            ...defaults,
            ...saved,
            fallbackChains: { ...defaults.fallbackChains, ...saved.fallbackChains },
            modelDowngradeChains: {
                ...defaults.modelDowngradeChains,
                ...saved.modelDowngradeChains,
            },
            themeConfig: saved.themeConfig
                ? { ...defaults.themeConfig, ...saved.themeConfig }
                : defaults.themeConfig,
            notificationPrefs: saved.notificationPrefs
                ? { ...defaults.notificationPrefs, ...saved.notificationPrefs }
                : defaults.notificationPrefs,
            dataManagement: saved.dataManagement
                ? { ...defaults.dataManagement, ...saved.dataManagement }
                : defaults.dataManagement,
        };
    }

    private async load() {
        try {
            const saved = await this.deps.database.getKv<SystemSettings>(SETTINGS_KEY);
            if (saved) {
                this.settings = this.deepMergeSettings(DEFAULTS, saved);
                if (saved.theme) this.applySettings({ theme: saved.theme });
            }
        } catch (e) {
            LOGGER.error('SettingsService', 'Failed to load settings', { error: e });
        }
    }

    private async loadProfiles() {
        try {
            const saved = await this.deps.database.getKv<SettingsProfile[]>(PROFILES_KEY);
            if (saved) this.profiles = saved;
        } catch (e) {
            LOGGER.error('SettingsService', 'Failed to load profiles', { error: e });
        }
    }

    private saveProfiles() {
        this.deps.database
            .setKv(PROFILES_KEY, this.profiles)
            .catch((e: Error) =>
                LOGGER.error('SettingsService', 'Failed to persist profiles', { error: e }),
            );
    }

    private applySettings(changes: Partial<SystemSettings>) {
        if (changes.defaultMode !== undefined) {
            this.deps.routerService.setStrategy(mapDefaultModeToStrategy(changes.defaultMode));
        }
        if (changes.explorationFactor !== undefined) {
            this.deps.kernel.setExplorationFactor(changes.explorationFactor);
        }
        if (changes.slaMode !== undefined) {
            this.deps.kernel.setSLAMode(changes.slaMode);
        }
        if (changes.theme !== undefined) {
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-theme', changes.theme);
            }
        }
    }

    getSettings(): SystemSettings {
        return { ...this.settings };
    }

    async updateSettings(updates: Partial<SystemSettings>) {
        const validated = validateSettings(updates);
        LOGGER.info('SettingsService', 'Settings updated', { changedKeys: Object.keys(validated) });
        const snapshot = { ...this.settings };
        this.settings = this.deepMergeSettings(this.settings, validated);
        this.applySettings(validated);
        await withTransaction(
            'SettingsService',
            async (tx) => {
                tx.deferPersist(
                    () => this.deps.database.setKv(SETTINGS_KEY, this.settings),
                    async () => {
                        this.settings = snapshot;
                    },
                );
                tx.deferEmit(EVENTS.SETTINGS_UPDATED, {
                    settings: { ...this.settings },
                    changes: validated,
                });
                tx.deferEmit(EVENTS.NOTIFICATION, { message: 'Settings updated', type: 'info' });
            },
            this.deps.eventBus,
        );
        this.listeners.forEach((cb) => cb({ ...this.settings }));
    }

    async reset() {
        const snapshot = { ...this.settings };
        this.settings = { ...DEFAULTS };
        this.applySettings(DEFAULTS);
        await withTransaction(
            'SettingsService',
            async (tx) => {
                tx.deferPersist(
                    () => this.deps.database.setKv(SETTINGS_KEY, this.settings),
                    async () => {
                        this.settings = snapshot;
                    },
                );
                tx.deferEmit(EVENTS.SETTINGS_UPDATED, {
                    settings: { ...this.settings },
                    changes: DEFAULTS,
                });
                tx.deferEmit(EVENTS.NOTIFICATION, {
                    message: 'Settings reset to defaults',
                    type: 'info',
                });
            },
            this.deps.eventBus,
        );
        this.listeners.forEach((cb) => cb({ ...this.settings }));
    }

    subscribe(listener: SettingsListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    async destroy() {
        this._initialized = false;
        this.listeners.clear();
    }

    exportSettings(): string {
        return JSON.stringify(this.settings, null, 2);
    }

    importSettings(jsonData: string): boolean {
        try {
            const parsed = safeJsonParse(jsonData);
            const validated = validateSettings(parsed as Partial<SystemSettings>);
            if (Object.keys(validated).length === 0) return false;
            this.updateSettings(validated);
            return true;
        } catch (e) {
            LOGGER.warn('SettingsService', 'Import settings failed', { error: e });
            return false;
        }
    }

    saveProfile(name: string, description: string): SettingsProfile {
        const profile: SettingsProfile = {
            id: `profile-${Date.now()}`,
            name,
            description,
            settings: { ...this.settings },
            created: Date.now(),
        };
        this.profiles.push(profile);
        if (this.profiles.length > MAX_PROFILES) this.profiles = this.profiles.slice(-MAX_PROFILES);
        this.saveProfiles();
        return profile;
    }

    loadProfile(id: string): boolean {
        const profile = this.profiles.find((p) => p.id === id);
        if (!profile) return false;
        this.updateSettings(profile.settings);
        return true;
    }

    deleteProfile(id: string) {
        this.profiles = this.profiles.filter((p) => p.id !== id);
        this.saveProfiles();
    }

    getProfiles(): SettingsProfile[] {
        return [...this.profiles];
    }
}
