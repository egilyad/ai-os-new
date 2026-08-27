import type {
    IPluginSdkService,
    PluginManifest,
    PluginInstance,
    PluginHook,
} from '../contracts/plugin-sdk';

const genTs = () => Date.now() - Math.floor(Math.random() * 86400000 * 30);

const AVAILABLE_PLUGINS: PluginManifest[] = [
    {
        id: 'web-scraper',
        name: 'Web Scraper',
        version: '1.2.0',
        description: 'Extract and process web content for LLM context',
        author: 'Core Team',
        type: 'tool',
        entryPoint: '/plugins/web-scraper.js',
        permissions: ['network', 'storage'],
        minAppVersion: '4.0.0',
    },
    {
        id: 'code-analyzer',
        name: 'Code Analyzer',
        version: '0.9.0',
        description: 'Static code analysis and vulnerability scanning',
        author: 'DevTools Inc',
        type: 'tool',
        entryPoint: '/plugins/code-analyzer.js',
        permissions: ['filesystem', 'llm'],
        minAppVersion: '4.1.0',
    },
    {
        id: 'custom-dashboard',
        name: 'Custom Dashboard',
        version: '1.0.0',
        description: 'Build custom dashboard widgets with drag-and-drop',
        author: 'Community',
        type: 'panel',
        entryPoint: '/plugins/custom-dashboard.js',
        permissions: ['ui', 'storage'],
        minAppVersion: '4.2.0',
    },
    {
        id: 'dark-theme-pro',
        name: 'Dark Theme Pro',
        version: '2.1.0',
        description: 'Enhanced dark theme with custom color schemes',
        author: 'Design Studio',
        type: 'theme',
        entryPoint: '/plugins/dark-theme-pro.css',
        permissions: ['ui'],
        minAppVersion: '4.0.0',
    },
    {
        id: 'rate-limiter',
        name: 'Custom Rate Limiter',
        version: '1.0.0',
        description: 'Custom rate limiting strategy for provider calls',
        author: 'Ops Team',
        type: 'decorator',
        entryPoint: '/plugins/rate-limiter.js',
        permissions: ['eventbus', 'llm'],
        minAppVersion: '4.1.0',
    },
];

const VALID_TYPES: readonly PluginManifest['type'][] = [
    'tool',
    'provider',
    'decorator',
    'adapter',
    'theme',
    'panel',
];
const VALID_PERMISSIONS: readonly PluginManifest['permissions'][number][] = [
    'network',
    'filesystem',
    'eventbus',
    'storage',
    'llm',
    'ui',
];
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function validateManifest(m: PluginManifest): void {
    if (!m.id || !/^[a-z0-9_-]+$/.test(m.id)) throw new Error(`Invalid plugin id: "${m.id}"`);
    if (!m.name) throw new Error('Plugin name is required');
    if (!m.version || !SEMVER_RE.test(m.version))
        throw new Error(`Invalid semver version: "${m.version}"`);
    if (!m.description) throw new Error('Plugin description is required');
    if (!m.author) throw new Error('Plugin author is required');
    if (!m.type || !VALID_TYPES.includes(m.type))
        throw new Error(`Invalid plugin type: "${m.type}"`);
    if (!m.entryPoint) throw new Error('Plugin entryPoint is required');
    if (!Array.isArray(m.permissions)) throw new Error('Plugin permissions must be an array');
    for (const p of m.permissions) {
        if (!VALID_PERMISSIONS.includes(p)) throw new Error(`Invalid permission: "${String(p)}"`);
    }
    if (!m.minAppVersion || !SEMVER_RE.test(m.minAppVersion))
        throw new Error(`Invalid minAppVersion: "${m.minAppVersion}"`);
}

const MAX_INSTALLED_PLUGINS = 200;

export class PluginSdkService implements IPluginSdkService {
    private installed: PluginInstance[] = [
        {
            manifest: { ...AVAILABLE_PLUGINS[0]! },
            status: 'enabled',
            installedAt: genTs(),
            lastActivated: Date.now() - 86400000 * 2,
            config: { maxPages: 10, userAgent: 'AI-OS-Bot' },
        },
        {
            manifest: { ...AVAILABLE_PLUGINS[3]! },
            status: 'enabled',
            installedAt: genTs(),
            lastActivated: Date.now() - 86400000 * 5,
            config: { primaryColor: '#1e293b', accentColor: '#8b5cf6', fontScale: 1.0 },
        },
    ];

    getInstalledPlugins(): PluginInstance[] {
        return [...this.installed];
    }

    getAvailablePlugins(): PluginManifest[] {
        return AVAILABLE_PLUGINS.filter(
            (avail) => !this.installed.some((inst) => inst.manifest.id === avail.id),
        );
    }

    installPlugin(manifest: PluginManifest): PluginInstance {
        validateManifest(manifest);
        const existing = this.installed.find((i) => i.manifest.id === manifest.id);
        if (existing) throw new Error(`Plugin ${manifest.id} already installed`);
        const instance: PluginInstance = {
            manifest: { ...manifest },
            status: 'enabled',
            installedAt: Date.now(),
            lastActivated: Date.now(),
            config: {},
        };
        if (this.installed.length >= MAX_INSTALLED_PLUGINS) {
            this.installed.shift();
        }
        this.installed.push(instance);
        return { ...instance };
    }

    uninstallPlugin(id: string): void {
        this.installed = this.installed.filter((i) => i.manifest.id !== id);
    }

    enablePlugin(id: string): void {
        const plugin = this.installed.find((i) => i.manifest.id === id);
        if (plugin) {
            plugin.status = 'enabled';
            plugin.lastActivated = Date.now();
        }
    }

    disablePlugin(id: string): void {
        const plugin = this.installed.find((i) => i.manifest.id === id);
        if (plugin) plugin.status = 'disabled';
    }

    getPluginConfig(id: string): Record<string, unknown> {
        return { ...(this.installed.find((i) => i.manifest.id === id)?.config || {}) };
    }

    updatePluginConfig(id: string, config: Record<string, unknown>): void {
        const plugin = this.installed.find((i) => i.manifest.id === id);
        if (plugin) plugin.config = { ...plugin.config, ...config };
    }

    getPluginHooks(pluginId: string): PluginHook[] {
        const hooks: Record<string, PluginHook[]> = {
            'web-scraper': [
                {
                    name: 'onPageExtracted',
                    description: 'Called after page extraction',
                    eventName: 'plugin:page:extracted',
                    handler: 'handlePageExtracted',
                },
            ],
            'code-analyzer': [
                {
                    name: 'onAnalysisComplete',
                    description: 'Called when code analysis finishes',
                    eventName: 'plugin:analysis:complete',
                    handler: 'handleAnalysis',
                },
            ],
        };
        return hooks[pluginId] || [];
    }
}
