import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockServers = [
    { id: 's1', name: 'Local Tools', url: 'http://localhost:9000', status: 'connected' },
    { id: 's2', name: 'Remote Box', url: 'http://example.com:9000', status: 'disconnected' },
];

vi.mock('../../kernel/instances', () => ({
    mcpService: {
        getServers: vi.fn(() => [...mockServers]),
        getConnectionStats: vi.fn(() => ({ total: 2, connected: 1, disconnected: 1, error: 0 })),
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
        reconnectAll: vi.fn(() => Promise.resolve(1)),
        removeServer: vi.fn(),
        listTools: vi.fn(() => Promise.resolve([])),
        listResources: vi.fn(() => Promise.resolve([])),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: { NOTIFICATION: 'notification' },
    rootLogger: {
        child: vi.fn(() => ({
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        })),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string | number>) => {
            const map: Record<string, string> = {
                'mcp.title': 'MCP Servers',
                'mcp.subtitle': 'Manage Model Context Protocol servers',
                'mcp.reconnect_all': 'Reconnect All',
                'mcp.add': 'Add Server',
                'mcp.search_placeholder': 'Search servers...',
                'mcp.empty_search': 'No servers match your search',
                'mcp.empty_none': 'No MCP servers configured',
                'mcp.empty_desc': 'Add a server to get started',
                'mcp.error_connect': 'Failed to connect',
                'mcp.error_reconnect': 'Failed to reconnect',
                'mcp.error_list': 'Failed to list capabilities',
                'mcp.error_load': 'Failed to load servers',
                'mcp.confirm_remove_title': 'Remove Server',
                'mcp.notif_reconnected': 'Reconnected',
                'mcp.stats.total': 'Total',
                'mcp.stats.connected': 'Connected',
                'mcp.stats.disconnected': 'Disconnected',
                'mcp.stats.errors': 'Errors',
                'common.dismiss_error': 'Dismiss error',
            };
            let text = map[key] ?? key;
            for (const [k, v] of Object.entries(params ?? {})) {
                text = text.replace(`{${k}}`, String(v));
            }
            return text;
        },
    }),
}));

describe('MCPPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders servers and connection stats', async () => {
        const Panel = (await import('./MCPPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Local Tools')).toBeDefined();
        expect(screen.getByText('Remote Box')).toBeDefined();
        expect(screen.getByText('MCP Servers')).toBeDefined();
    });

    it('shows a load error instead of crashing the mount', async () => {
        const { mcpService } = await import('../../kernel/instances');
        vi.mocked(mcpService.getServers).mockImplementationOnce(() => {
            throw new Error('store down');
        });
        const Panel = (await import('./MCPPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Failed to load servers')).toBeDefined();
    });

    it('search tolerates legacy servers without name or url', async () => {
        const { mcpService } = await import('../../kernel/instances');
        vi.mocked(mcpService.getServers).mockReturnValueOnce([{ id: 'legacy' }] as never);
        const Panel = (await import('./MCPPanel')).default;
        render(<Panel />);
        await screen.findByText('MCP Servers');
        fireEvent.change(screen.getByPlaceholderText('Search servers...'), {
            target: { value: 'zzz' },
        });
        expect(await screen.findByText('No servers match your search')).toBeDefined();
    });

    it('shows a capabilities error when expanding fails', async () => {
        const { mcpService } = await import('../../kernel/instances');
        vi.mocked(mcpService.listTools).mockRejectedValueOnce(new Error('refused'));
        const Panel = (await import('./MCPPanel')).default;
        render(<Panel />);
        await screen.findByText('Local Tools');
        fireEvent.click(screen.getAllByText('Remote Box')[0]);
        expect(await screen.findByText('Failed to list capabilities')).toBeDefined();
    });

    it('reconnect-all notifies with the reconnected count', async () => {
        const { mcpService, eventBus } = await import('../../kernel/instances');
        const Panel = (await import('./MCPPanel')).default;
        render(<Panel />);
        await screen.findByText('Local Tools');
        fireEvent.click(screen.getByText('Reconnect All'));
        await waitFor(() => expect(mcpService.reconnectAll).toHaveBeenCalled());
        await waitFor(() =>
            expect(eventBus.emit).toHaveBeenCalledWith(
                'notification',
                expect.objectContaining({ type: 'success' }),
            ),
        );
    });
});
