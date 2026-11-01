import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

const manifest = {
    id: 'acme.search',
    name: 'Search',
    version: '1.0.0',
    engines: { os: '4.0.0' },
    contributes: {
        tools: [{ name: 'acme.search', handler: 'search' }],
        subscriptions: [{ event: 'agent:start' }],
    },
};

vi.mock('../../kernel/instances', () => ({
    pluginRegistry: {
        list: vi.fn().mockReturnValue([
            { manifest, status: 'active' },
            { manifest: { ...manifest, id: 'acme.other', name: 'Other' }, status: 'inactive' },
        ]),
        getStats: vi.fn().mockReturnValue({ total: 2, active: 1, inactive: 1, error: 0 }),
        activate: vi.fn().mockResolvedValue(true),
        deactivate: vi.fn().mockResolvedValue(true),
        unregister: vi.fn().mockResolvedValue(true),
    },
    pluginLoader: {
        load: vi.fn().mockResolvedValue(true),
        loadFromJson: vi.fn().mockResolvedValue({ ok: true }),
        unload: vi.fn().mockResolvedValue(true),
    },
    eventBus: {
        on: vi.fn(() => vi.fn()),
    },
    EVENTS: {
        PLUGIN_REGISTERED: 'plugin:registered',
        PLUGIN_UNREGISTERED: 'plugin:unregistered',
        PLUGIN_ACTIVATED: 'plugin:activated',
        PLUGIN_DEACTIVATED: 'plugin:deactivated',
    },
    rootLogger: {
        child: vi
            .fn()
            .mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../ModuleInfo', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: (props: any) => <span data-testid="module-info">{props.moduleKey}</span>,
}));

describe('PluginManagerPanel (smoke)', () => {
    it('renders registered plugins without crashing', async () => {
        const { default: PluginManagerPanel } = await import('./PluginManagerPanel');
        render(<PluginManagerPanel />);
        expect(await screen.findByText('plugin.title')).toBeDefined();
        expect(screen.getByText('Search')).toBeDefined();
        expect(screen.getByText('Other')).toBeDefined();
        expect(screen.getByText('acme.search')).toBeDefined();
    });

    it('loads a manifest from JSON input', async () => {
        const { pluginLoader } = await import('../../kernel/instances');
        const { default: PluginManagerPanel } = await import('./PluginManagerPanel');
        render(<PluginManagerPanel />);
        fireEvent.click(screen.getByText('plugin.load_manifest'));
        const textarea = document.querySelector('textarea');
        expect(textarea).not.toBeNull();
        fireEvent.change(textarea!, { target: { value: JSON.stringify(manifest) } });
        fireEvent.click(screen.getByText('plugin.load'));
        expect(vi.mocked(pluginLoader.loadFromJson)).toHaveBeenCalledWith(JSON.stringify(manifest));
    });

    it('deactivates an active plugin', async () => {
        const { pluginRegistry } = await import('../../kernel/instances');
        const { default: PluginManagerPanel } = await import('./PluginManagerPanel');
        render(<PluginManagerPanel />);
        fireEvent.click(screen.getAllByText('plugin.deactivate')[0]);
        expect(vi.mocked(pluginRegistry.deactivate)).toHaveBeenCalledWith('acme.search');
    });
});
