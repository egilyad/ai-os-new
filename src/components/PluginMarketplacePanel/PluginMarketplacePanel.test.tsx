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

vi.mock('../../kernel/instances', () => ({
    pluginRegistry: {
        list: vi.fn().mockReturnValue([]),
    },
    pluginLoader: {
        load: vi.fn().mockResolvedValue(true),
        unload: vi.fn().mockResolvedValue(true),
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

describe('PluginMarketplacePanel (smoke)', () => {
    it('renders catalog entries', async () => {
        const { default: PluginMarketplacePanel } = await import('./PluginMarketplacePanel');
        render(<PluginMarketplacePanel />);
        expect(await screen.findByText('plugin.marketplace_title')).toBeDefined();
        expect(screen.getByText('Demo Search Provider')).toBeDefined();
        expect(screen.getByText('Demo Weather')).toBeDefined();
        expect(screen.getByText('Demo MCP Bridge')).toBeDefined();
    });

    it('installs a plugin from catalog', async () => {
        const { pluginLoader } = await import('../../kernel/instances');
        const { default: PluginMarketplacePanel } = await import('./PluginMarketplacePanel');
        render(<PluginMarketplacePanel />);
        const buttons = screen.getAllByText('plugin.install');
        expect(buttons.length).toBeGreaterThan(0);
        fireEvent.click(buttons[0]);
        expect(vi.mocked(pluginLoader.load)).toHaveBeenCalled();
    });
});
