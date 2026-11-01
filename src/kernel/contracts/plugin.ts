/**
 * Плагинная система (SPEC_06 / ROADMAP_09 §P3).
 *
 * Гибрид: манифест в духе Chrome MV3 (строгие permissions) + contributes/
 * активация в духе VS Code. Плагин может регистрировать сервисы, панели,
 * инструменты, MCP-серверы и подписки на события.
 */

export interface PluginServiceContribution {
    id: string;
}

export interface PluginPanelContribution {
    id: string;
    titleKey?: string;
    /** Путь к HTML-точке входа (для sandboxed iframe). */
    entry: string;
}

export interface PluginToolContribution {
    name: string;
    schema?: string;
    handler?: string;
}

export interface PluginMcpContribution {
    name: string;
}

export interface PluginSubscriptionContribution {
    event: string;
    handler?: string;
}

export interface PluginContributions {
    services?: PluginServiceContribution[];
    panels?: PluginPanelContribution[];
    tools?: PluginToolContribution[];
    mcpServers?: PluginMcpContribution[];
    subscriptions?: PluginSubscriptionContribution[];
}

export interface PluginManifest {
    id: string;
    name: string;
    description?: string;
    version: string;
    /** Минимальная версия ядра (semver). */
    engines: { os: string };
    activationEvents?: string[];
    contributes: PluginContributions;
    permissions?: string[];
}

export type PluginStatus = 'inactive' | 'active' | 'error';

export interface RegisteredPlugin {
    manifest: PluginManifest;
    status: PluginStatus;
    error?: string;
}

export interface IPluginRegistry {
    register(manifest: PluginManifest): Promise<boolean>;
    unregister(id: string): Promise<boolean>;
    activate(id: string): Promise<boolean>;
    deactivate(id: string): Promise<boolean>;
    get(id: string): RegisteredPlugin | undefined;
    list(): RegisteredPlugin[];
    has(id: string): boolean;
}
