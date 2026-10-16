/**
 * ProjectsPanel smoke tests — render, create, list, select.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lazy service instances before importing the component
const mockList = vi.fn().mockResolvedValue([]);
const mockCreate = vi.fn().mockResolvedValue({ id: 'p1', name: 'Test', description: '', type: 'website', status: 'draft', agentIds: [], createdAt: Date.now(), updatedAt: Date.now() });

vi.mock('../../kernel/instances/services-extras', () => ({
    projectManagerService: () => ({
        list: mockList,
        create: mockCreate,
        get: vi.fn(),
    }),
    projectWorkspaceService: {
        getTree: vi.fn(() => Promise.reject(new Error('workspace down'))),
    },
}));

vi.mock('../../stores/project-store', () => {
    const store: Record<string, unknown> = {
        projects: new Map(),
        order: [],
        tasks: new Map(),
        runs: new Map(),
        files: new Map(),
        assignments: new Map(),
        selectedProjectId: null,
        loading: false,
        error: null,
        loadProjects: vi.fn(),
        select: vi.fn(),
        refresh: vi.fn(),
        clear: vi.fn(),
    };
    return {
        useProjectStore: Object.assign(
            vi.fn((selector: ((s: typeof store) => unknown) | undefined) => selector ? selector(store) : store),
            {
                getState: () => store,
                setState: (patch: Record<string, unknown>) => Object.assign(store, patch),
            }
        ),
        ensureSubscribed: vi.fn(),
        destroy: vi.fn(),
    };
});

// Stable across renders: loadTab depends on t, and a fresh closure every
// render would re-fire its effect into a loop (Zone 7 hazard).
// vi.hoisted because the component is statically imported below.
const { stableProjectsT } = vi.hoisted(() => ({
    stableProjectsT: (key: string) => key,
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: stableProjectsT,
        lang: 'en',
    }),
}));

import ProjectsPanel from './ProjectsPanel';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('ProjectsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title', () => {
        render(<ProjectsPanel />, { wrapper: Wrapper });
        expect(screen.getByText('projects.title')).toBeTruthy();
    });

    it('shows empty state', () => {
        render(<ProjectsPanel />, { wrapper: Wrapper });
        expect(screen.getByText('projects.empty')).toBeTruthy();
    });

    it('shows new project button', () => {
        render(<ProjectsPanel />, { wrapper: Wrapper });
        expect(screen.getByText('projects.new')).toBeTruthy();
    });

    it('renders legacy projects without agentIds', async () => {
        const { useProjectStore } = await import('../../stores/project-store');
        useProjectStore.setState({
            projects: new Map([
                ['p9', { id: 'p9', name: 'Legacy', description: '', type: 'website', status: 'draft' }],
            ]),
            order: ['p9'],
            selectedProjectId: null,
        });
        try {
            render(<ProjectsPanel />, { wrapper: Wrapper });
            expect(await screen.findByText('Legacy')).toBeTruthy();
        } finally {
            useProjectStore.setState({ projects: new Map(), order: [], selectedProjectId: null });
        }
    });

    it('shows a tab error banner when tab loading fails', async () => {
        const { useProjectStore } = await import('../../stores/project-store');
        useProjectStore.setState({
            projects: new Map([
                ['p1', { id: 'p1', name: 'P1', description: '', type: 'website', status: 'draft', agentIds: [] }],
            ]),
            order: ['p1'],
            selectedProjectId: 'p1',
        });
        try {
            render(<ProjectsPanel />, { wrapper: Wrapper });
            expect(await screen.findByText('projects.error_load_tab')).toBeTruthy();
        } finally {
            useProjectStore.setState({ projects: new Map(), order: [], selectedProjectId: null });
        }
    });
});
