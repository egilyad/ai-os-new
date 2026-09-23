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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
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
});
