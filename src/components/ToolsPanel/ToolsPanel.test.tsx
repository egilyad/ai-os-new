import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.hoisted(() => {
    (globalThis as Record<string, unknown>).Blocks = () => null;
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string): string =>
            ({
                'tools.title': 'Tool & Capability Registry',
                'tools.subtitle': 'Manage API tools, scripts, and database connectors',
                'tools.search_placeholder': 'Search tools by name or type...',
                'tools.filter_aria': 'Filter by type',
                'tools.filter.all': 'All',
                'tools.filter.rest': 'REST API',
                'tools.filter.scripts': 'Scripts',
                'tools.filter.db': 'Database',
                'tools.export_aria': 'Export tools configuration',
                'tools.import_aria': 'Import tools configuration',
                'tools.register': 'Register Capability',
                'tools.empty_filter': 'No tools match current filters',
                'tools.empty_none': 'No tools registered yet',
                'tools.security_heading': 'Execution Isolation Active',
                'tools.secrets_label': 'Secrets & Credentials',
                'tools.network_label': 'Network Access',
                'tools.schema_desc': 'Auto-detected from tool definition',
                'tools.exec_params_label': 'Execution Parameters',
                'tools.exec_reset': 'Reset',
                'tools.exec_aria': 'Execute tool with current parameters',
                'tools.exec_running': 'Running...',
                'tools.exec_button': 'Run Capability Test',
                'tools.exec_output_label': 'Execution Output',
                'tools.exec_no_output': 'No output',
                'tools.exec_no_output_hint': 'Run the tool to see output here',
                'tools.no_selection': 'No tool selected',
                'tools.tab_sandbox': 'Sandbox',
                'tools.tab_schema': 'Schema',
                'tools.tab_security': 'Security',
                'tools.status.active': 'Active',
                'tools.status.disabled': 'Disabled',
                'common.export': 'Export',
                'common.import': 'Import',
                'common.dismiss_error': 'Dismiss error',
                'common.unknown_error': 'An unknown error occurred',
                'common.active': 'Active',
                'common.not_available': 'N/A',
                'tools.register_title': 'Register Tool',
                'tools.register_name': 'Name',
                'tools.register_type': 'Type',
                'tools.register_description': 'Description',
                'tools.register_cancel': 'Cancel',
                'tools.register_create': 'Register',
                'tools.register_error_name': 'Enter a tool name',
                'tools.register_success': 'Tool registered',
                'tools.register_failed': 'Failed to register tool',
                'tools.notif_exported': 'Tools exported successfully',
                'tools.notif_imported': 'Imported',
            })[key] ?? key,
    }),
}));

vi.mock('../ModalShell', () => ({
    ModalShell: (props: { open: boolean; children: ReactNode }) =>
        props.open ? <div>{props.children}</div> : null,
}));

const mockTools = [
    {
        id: 't1',
        name: 'Web Search',
        description: 'Search the web via APIs',
        type: 'api',
        enabled: true,
        language: 'typescript',
    },
    {
        id: 't2',
        name: 'Code Runner',
        description: 'Execute Python in sandbox',
        type: 'script',
        enabled: false,
        language: 'python',
    },
    {
        id: 't3',
        name: 'DB Query',
        description: 'Query PostgreSQL',
        type: 'database',
        enabled: true,
        language: 'sql',
    },
];

vi.mock('../../kernel/instances', () => ({
    rootLogger: {
        child: vi.fn(() => ({
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        })),
    },
    toolService: {
        getTools: vi.fn(() => mockTools),
        exportTools: vi.fn(() => '[]'),
        importTools: vi.fn(() => 2),
        execute: vi.fn(() => Promise.resolve({ status: 'success', data: { result: 'ok' } })),
        toggleTool: vi.fn(),
        addTool: vi.fn(() => Promise.resolve()),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => () => {}),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
        onSafe: vi.fn(() => vi.fn()),
    },
    EVENTS: { NOTIFICATION: 'notification' },
}));

describe('ToolsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Tool heading', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        expect(await screen.findByText('Tool & Capability Registry')).toBeDefined();
    });

    it('renders all tool cards initially', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        expect(await screen.findByText('Web Search')).toBeDefined();
        expect(screen.getByText('Code Runner')).toBeDefined();
        expect(screen.getByText('DB Query')).toBeDefined();
    });

    it('filters tools by search query', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        const search = document.querySelector(
            'input[placeholder*="Search tools"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'Code' } });
        await waitFor(() => {
            expect(screen.queryByText('Web Search')).toBeNull();
        });
        expect(screen.getByText('Code Runner')).toBeDefined();
    });

    it('filters tools by type dropdown', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        const select = document.querySelector('select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'script' } });
        await waitFor(() => {
            expect(screen.queryByText('Web Search')).toBeNull();
        });
        expect(screen.getByText('Code Runner')).toBeDefined();
    });

    it('shows empty state when no tools match filter', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        const search = document.querySelector(
            'input[placeholder*="Search tools"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'ZZZNoMatch' } });
        expect(screen.getByText('No tools match current filters')).toBeDefined();
    });

    it('shows inspector panel when tool is selected', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Web Search'));
        await waitFor(() => {
            expect(screen.getByText(/ID: t1/)).toBeDefined();
        });
    });

    it('shows three inspector tabs (Sandbox, Schema, Security)', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Web Search'));
        expect(await screen.findByText('Sandbox')).toBeDefined();
        expect(screen.getByText('Schema')).toBeDefined();
        expect(screen.getByText('Security')).toBeDefined();
    });

    it('switches inspector tab to Security', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Web Search'));
        await screen.findByText('Sandbox');
        fireEvent.click(screen.getByText('Security'));
        expect(await screen.findByText('Execution Isolation Active')).toBeDefined();
    });

    it('shows execution output area in Sandbox tab', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Web Search'));
        await screen.findByText('Sandbox');
        expect(await screen.findByText('Execution Output')).toBeDefined();
    });

    it('renders Export and Import and Register buttons', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Tool & Capability Registry');
        expect(screen.getByText('Export')).toBeDefined();
        expect(screen.getByText('Import')).toBeDefined();
        expect(screen.getByText('Register Capability')).toBeDefined();
    });

    it('shows Run Capability Test button', async () => {
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Web Search'));
        await screen.findByText('Sandbox');
        expect(screen.getByText('Run Capability Test')).toBeDefined();
    });

    it('Register opens a working modal that calls addTool', async () => {
        const { toolService } = await import('../../kernel/instances');
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Register Capability'));
        expect(await screen.findByText('Register Tool')).toBeDefined();
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Tool' } });
        fireEvent.click(screen.getByText('Register'));
        await waitFor(() =>
            expect(toolService.addTool).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'My Tool', type: 'api' }),
            ),
        );
    });

    it('Register validates the name instead of calling addTool', async () => {
        const { toolService } = await import('../../kernel/instances');
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Web Search');
        fireEvent.click(screen.getByText('Register Capability'));
        await screen.findByText('Register Tool');
        fireEvent.click(screen.getByText('Register'));
        expect(await screen.findByText('Enter a tool name')).toBeDefined();
        expect(toolService.addTool).not.toHaveBeenCalled();
    });

    it('search tolerates legacy tools without name or description', async () => {
        const { toolService } = await import('../../kernel/instances');
        vi.mocked(toolService.getTools).mockReturnValueOnce([
            { id: 'legacy', type: 'api' },
        ] as never);
        const ToolsPanel = (await import('./ToolsPanel')).default;
        render(<ToolsPanel />);
        await screen.findByText('Tool & Capability Registry');
        const search = document.querySelector(
            'input[placeholder*="Search tools"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'zzz' } });
        expect(screen.getByText('No tools match current filters')).toBeDefined();
    });
});
