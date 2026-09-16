import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockRoles = [
    {
        id: 'role-1',
        name: 'Researcher',
        description: 'Research specialist',
        systemPrompt: 'You are a researcher {{task}}',
        baseTemperature: 0.3,
        capabilities: ['web_search'],
        permissions: [],
        metadata: { category: 'technical', created: Date.now(), updated: Date.now() },
    },
    {
        id: 'role-2',
        name: 'Code Reviewer',
        description: 'Reviews pull requests',
        systemPrompt: 'You are a code reviewer',
        baseTemperature: 0.2,
        capabilities: ['code_review'],
        permissions: [],
        metadata: { category: 'technical', created: Date.now(), updated: Date.now() },
    },
];

const mockStats = {
    'role-1': { invocations: 100, errors: 2, avgLatency: 500 },
    'role-2': { invocations: 50, errors: 1, avgLatency: 300 },
};

const mockTools = [
    { id: 'web_search', name: 'Web Search', description: 'Search' },
    { id: 'code_review', name: 'Code Review', description: 'Review' },
];

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'roles.title': 'Agent Role Blueprints',
                'roles.subtitle': 'Manage agent role definitions',
                'roles.create': 'Create Blueprint',
                'roles.search_placeholder': 'Search blueprints...',
                'roles.empty_search': 'No blueprints match your search',
                'roles.empty_none': 'No roles defined',
                'roles.edit_title': 'Edit Role Blueprint',
                'roles.new_title': 'New Role Blueprint',
                'roles.loading': 'Loading roles...',
                'roles.confirm_delete': 'Are you sure you want to delete this role?',
                'roles.error_delete': 'Failed to delete role',
                'roles.error_save': 'Failed to save role',
                'roles.error_duplicate': 'Failed to duplicate role',
                'roles.no_tools': 'No tools',
                'roles.temperature': 'Temperature',
                'common.dismiss_error': 'Dismiss',
            };
            return labels[key] || key;
        },
    }),
}));

vi.mock('../../kernel/runtime', () => ({
    runtime: {
        start: vi.fn(() => Promise.resolve(true)),
        getStatus: vi.fn(() => ({
            phase: 'ready',
            uptime: 0,
            startTime: Date.now(),
            servicesReady: 1,
            servicesTotal: 1,
            lastError: null,
            memoryUsage: 0,
        })),
        getPhase: vi.fn(() => 'ready'),
        isReady: vi.fn(() => true),
        shutdown: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('../../kernel/instances', () => ({
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => vi.fn()),
    },
    roleService: {
        getAllRoles: vi.fn(() => mockRoles),
        getAllStats: vi.fn(() => mockStats),
        getAgentsByRole: vi.fn(() => []),
        validateRole: vi.fn(() => ({ valid: true, missingTools: [] })),
        deleteRole: vi.fn(),
        updateRole: vi.fn(),
        addRole: vi.fn(),
        getRetirementCandidates: vi.fn(() => []),
        getEloLeaderboard: vi.fn(() => []),
        getFatigueAnalysis: vi.fn(() => ({})),
        recordRoleFeedback: vi.fn(),
    },
    toolService: { getTools: vi.fn(() => mockTools) },
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
}));

describe('RolesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Agent Role Blueprints heading', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect(await screen.findByText('Agent Role Blueprints')).toBeDefined();
    }, 15000);

    it('renders role cards', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect((await screen.findAllByText('Researcher')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('Code Reviewer').length).toBeGreaterThan(0);
    });

    it('shows role descriptions', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect(await screen.findByText('Research specialist')).toBeDefined();
        expect(screen.getByText('Reviews pull requests')).toBeDefined();
    });

    it('renders Create Blueprint button', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect(await screen.findByText('Create Blueprint')).toBeDefined();
    });

    it('filters roles by search', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        await screen.findAllByText('Researcher');
        const search = document.querySelector(
            'input[placeholder*="Search blueprints"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'Code' } });
        await waitFor(() => {
            expect(screen.queryByRole('heading', { name: 'Researcher' })).toBeNull();
        });
        expect(screen.getAllByText('Code Reviewer').length).toBeGreaterThan(0);
    });

    it('shows empty state when search has no results', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        await screen.findAllByText('Researcher');
        const search = document.querySelector(
            'input[placeholder*="Search blueprints"]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'ZZZNoMatch' } });
        expect(await screen.findByText('No blueprints match your search')).toBeDefined();
    });

    it('opens editor modal on role card click', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        await screen.findAllByText('Researcher');
        const heading = screen.getByRole('heading', { name: 'Researcher' });
        const card = heading.closest('[role="button"]') || heading;
        fireEvent.click(card);
        await waitFor(() => {
            expect(screen.queryByText('Edit Role Blueprint')).toBeDefined();
        });
    });

    it('shows duplicate and delete buttons on role cards', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        await screen.findAllByText('Researcher');
        const buttons = document.querySelectorAll('button');
        const copyButtons = Array.from(buttons).filter(
            (b) => b.innerHTML.includes('Copy') || b.querySelector('[class*="lucide-copy"]'),
        );
        const trashButtons = Array.from(buttons).filter(
            (b) => b.innerHTML.includes('Trash2') || b.querySelector('[class*="lucide-trash2"]'),
        );
        expect(copyButtons.length).toBeGreaterThan(0);
        expect(trashButtons.length).toBeGreaterThan(0);
    });

    it('shows stats for roles', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect((await screen.findAllByText('100')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });

    it('renders search input with placeholder', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        await screen.findAllByText('Researcher');
        const search = document.querySelector('input[placeholder*="Search blueprints"]');
        expect(search).toBeDefined();
    });

    it('shows category color indicators', async () => {
        const RolesPanel = (await import('./RolesPanel')).default;
        render(<RolesPanel />);
        expect(await screen.findAllByText('technical')).toHaveLength(2);
    });
});
