import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockSkills = [
    {
        id: 'sk-1',
        name: 'Deep Web Researcher',
        description: 'Multi-step research',
        category: 'analysis',
        status: 'active',
        toolsUsed: ['Search', 'Summarizer'],
        version: '2.1.0',
        executionCount: 47,
    },
    {
        id: 'sk-2',
        name: 'Code Reviewer Pro',
        description: 'Review code',
        category: 'analysis',
        status: 'installed',
        toolsUsed: ['Git CLI', 'Linter'],
        version: '1.4.2',
        executionCount: 23,
    },
    {
        id: 'sk-3',
        name: 'Social Media Manager',
        description: 'Manage socials',
        category: 'generation',
        status: 'not_installed',
        toolsUsed: ['Twitter API'],
        version: '3.0.1',
        executionCount: 0,
    },
];

const { mockGetSkills } = vi.hoisted(() => ({
    mockGetSkills: vi.fn(),
}));

vi.mock('../../kernel/instances', () => ({
    skillService: {
        getSkills: mockGetSkills,
        exportSkills: vi.fn(() => '[]'),
        importSkills: vi.fn(() => 1),
        toggleActive: vi.fn(),
        installSkill: vi.fn(),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => vi.fn()),
    },
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string | number>) => {
            const map: Record<string, string> = {
                'skills.title': 'Cognitive Skills',
                'skills.subtitle': 'Extend agent capabilities with modular cognitive modules',
                'skills.hub': 'Extension Hub',
                'skills.installed': 'Installed ({count})',
                'skills.search_placeholder': 'Search extension hub...',
                'skills.empty_installed': 'No cognitive skills installed',
                'skills.empty_search': 'No skills match your search',
                'skills.empty_hub': 'No skills available in the extension hub',
                'skills.hub_hint_installed': 'Install skills from the Extension Hub to get started',
                'skills.hub_hint_search': 'Try a different search term or category',
                'skills.hub_hint_all': 'All skills are currently installed',
                'skills.toolchains': 'Required Toolchains',
                'skills.executions': '{count} Executions',
                'skills.install': 'Install',
                'skills.active': 'Active',
                'skills.inactive': 'Inactive',
                'skills.popular': 'Popular',
                'skills.clear': 'Clear',
                'skills.view_label': 'Skills view',
                'skills.perf_notice_title': 'Performance Notice',
                'skills.perf_notice_body': 'Skills consume context tokens.',
                'skills.error_export': 'Failed to export skills',
                'skills.error_import': 'Failed to import skills',
                'skills.error_toggle': 'Failed to toggle skill',
                'skills.error_install': 'Failed to install skill',
                'skills.notif_exported': 'Skills exported successfully',
                'skills.notif_imported': 'Imported',
                'skills.notif_import_failed': 'Failed to import skills',
                'skills.notif_toggled': 'Toggled',
                'skills.notif_installing': 'Installing...',
                'skills.notif_installed': 'Installed',
                'skills.toggle_aria': 'Toggle skill',
                'skills.install_aria': 'Install skill',
                'common.export': 'Export',
                'common.import': 'Import',
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

describe('SkillsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSkills.mockReturnValue(mockSkills);
    });

    it('renders Cognitive Skills heading', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText('Cognitive Skills')).toBeDefined();
    });

    it('renders skill cards for installed skills', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText('Deep Web Researcher')).toBeDefined();
        expect(screen.getByText('Code Reviewer Pro')).toBeDefined();
        expect(screen.queryByText('Social Media Manager')).toBeNull();
    });

    it('switches to marketplace tab showing not_installed skills', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Deep Web Researcher');
        fireEvent.click(screen.getByText('Extension Hub'));
        expect(await screen.findByText('Social Media Manager')).toBeDefined();
        await waitFor(() => {
            expect(screen.queryByText('Deep Web Researcher')).toBeNull();
        });
    });

    it('search filters skills in marketplace', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Deep Web Researcher');
        fireEvent.click(screen.getByText('Extension Hub'));
        await screen.findByText('Social Media Manager');
        const search = document.querySelector(
            'input[placeholder="Search extension hub..."]',
        ) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'Social' } });
        expect(screen.getByText('Social Media Manager')).toBeDefined();
    });

    it('shows empty state when no installed skills', async () => {
        mockGetSkills.mockReturnValue([mockSkills[2]]);
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText('No cognitive skills installed')).toBeDefined();
    });

    it('renders export and import buttons', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Cognitive Skills');
        expect(screen.getByText('Export')).toBeDefined();
        expect(screen.getByText('Import')).toBeDefined();
    });

    it('shows performance notice footer', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText(/Performance Notice/)).toBeDefined();
    });

    it('renders category filter buttons in marketplace', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Cognitive Skills');
        fireEvent.click(screen.getByText('Extension Hub'));
        expect(await screen.findByText('analysis')).toBeDefined();
        expect(screen.getAllByText('generation').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('orchestration')).toBeDefined();
    });

    it('shows Install button for marketplace skills', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Cognitive Skills');
        fireEvent.click(screen.getByText('Extension Hub'));
        await screen.findByText('Social Media Manager');
        expect(screen.getByText('Install')).toBeDefined();
    });

    it('shows the installed count on the tab', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText('Installed (2)')).toBeDefined();
    });

    it('renders 0 executions for legacy skills without a count', async () => {
        mockGetSkills.mockReturnValue([
            {
                id: 'legacy',
                name: 'Legacy Skill',
                description: 'Old record',
                category: 'analysis',
                status: 'active',
                version: '0.1',
            },
        ]);
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        expect(await screen.findByText('Legacy Skill')).toBeDefined();
        expect(screen.getByText('0 Executions')).toBeDefined();
        expect(screen.queryByText('Required Toolchains')).toBeNull();
    });

    it('has no fake Fine-tune Pipeline button', async () => {
        const SkillsPanel = (await import('./SkillsPanel')).default;
        render(<SkillsPanel />);
        await screen.findByText('Deep Web Researcher');
        expect(screen.queryByText('Fine-tune Pipeline')).toBeNull();
    });
});
