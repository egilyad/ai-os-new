export interface ThemeConfig {
    mode: 'dark' | 'light';
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: number;
    reducedMotion: boolean;
    highContrast: boolean;
}

export interface NotificationPreferences {
    enabled: boolean;
    healthAlerts: boolean;
    routingDecisions: boolean;
    policyViolations: boolean;
    agentEvents: boolean;
    errorsOnly: boolean;
    soundEnabled: boolean;
}

export interface DataManagementSettings {
    autoSaveInterval: number;
    maxHistoryEntries: number;
    maxTraceEntries: number;
    pruneMemoriesAfterDays: number;
    exportOnShutdown: boolean;
}

export interface SystemSettings {
    notifications: boolean;
    autoHealthCheck: boolean;
    defaultMode: 'broadcast' | 'single' | 'smart';
    streamingEnabled: boolean;
    historyPersistence: boolean;
    fallbackEnabled: boolean;
    debugMode: boolean;
    theme: 'dark' | 'light' | 'cyberpunk' | 'nature' | 'ocean' | 'sunset' | 'high-contrast';
    language: 'en' | 'ru';
    explorationFactor: number;
    slaMode: 'LOW_LATENCY' | 'HIGH_QUALITY' | 'BALANCED' | 'ECONOMY' | 'FREE_FIRST';
    themeConfig: ThemeConfig;
    notificationPrefs: NotificationPreferences;
    dataManagement: DataManagementSettings;
    sidebarCollapsed: boolean;
    telemetryEnabled: boolean;
    autoUpdateCheck: boolean;
    fallbackChains: Record<string, Array<{ provider: string; model?: string }>>;
    modelDowngradeChains: Record<string, string[]>;
}

export interface SettingsProfile {
    id: string;
    name: string;
    settings: Partial<SystemSettings>;
}

export interface ISettingsService {
    getSettings(): SystemSettings;
    updateSettings(updates: Partial<SystemSettings>): void;
    saveProfile(name: string, description: string): SettingsProfile;
    loadProfile(id: string): boolean;
    deleteProfile(id: string): void;
    getProfiles(): SettingsProfile[];
    subscribe(listener: (settings: SystemSettings) => void): () => void;
    destroy(): void;
}
