export type PluginType = 'tool' | 'provider' | 'decorator' | 'adapter' | 'theme' | 'panel';
export type PluginStatus = 'disabled' | 'enabled' | 'error';
export type PluginPermission = 'network' | 'filesystem' | 'eventbus' | 'storage' | 'llm' | 'ui';

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    type: PluginType;
    entryPoint: string;
    permissions: PluginPermission[];
    minAppVersion: string;
    icon?: string;
}

export interface PluginInstance {
    manifest: PluginManifest;
    status: PluginStatus;
    installedAt: number;
    lastActivated?: number;
    config: Record<string, unknown>;
    error?: string;
}

export interface PluginHook {
    name: string;
    description: string;
    eventName: string;
    handler: string;
}

export interface IPluginSdkService {
    getInstalledPlugins(): PluginInstance[];
    getAvailablePlugins(): PluginManifest[];
    installPlugin(manifest: PluginManifest): PluginInstance;
    uninstallPlugin(id: string): void;
    enablePlugin(id: string): void;
    disablePlugin(id: string): void;
    getPluginConfig(id: string): Record<string, unknown>;
    updatePluginConfig(id: string, config: Record<string, unknown>): void;
    getPluginHooks(pluginId: string): PluginHook[];
}
