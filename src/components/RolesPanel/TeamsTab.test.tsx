import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeamsTab from './TeamsTab';
import type { RoleTeam } from '../../kernel/contracts/role-team';

const navMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => navMock };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const team: RoleTeam = {
    id: 't1',
    name: 'Alpha',
    description: 'Test team',
    icon: '👥',
    color: '#64748b',
    roleIds: ['r1'],
    coordinationStrategy: 'parallel',
    metadata: { domain: 'research', created: 1, updated: 1 },
    executionConfig: {},
} as RoleTeam;

function makeSvc(over: Record<string, unknown> = {}) {
    return {
        executeTeam: vi.fn(async () => ({ status: 'done' })),
        deleteTeam: vi.fn(),
        listTeams: vi.fn(() => [team]),
        createTeam: vi.fn(),
        createFromTemplate: vi.fn(),
        ...over,
    };
}

function renderTab(svc: ReturnType<typeof makeSvc>, teams: RoleTeam[] = [team]) {
    return render(
        <MemoryRouter>
            <TeamsTab
                teamSvc={svc as never}
                teams={teams}
                setTeams={vi.fn()}
                roles={[]}
                teamTemplates={[]}
            />
        </MemoryRouter>,
    );
}

describe('TeamsTab honesty (Zone 3)', () => {
    it('shows the empty state and the New team opener with zero teams', () => {
        renderTab(makeSvc(), []);
        expect(screen.getByText(/No teams yet/)).toBeDefined();
        expect(screen.getByText('My Teams (0)')).toBeDefined();
        fireEvent.click(screen.getByText('+ New team'));
        expect(screen.getByText(/Create Team — Step/)).toBeDefined();
    });

    it('requires two clicks to delete a team', () => {
        const svc = makeSvc();
        renderTab(svc);
        fireEvent.click(screen.getByLabelText('Delete team Alpha'));
        expect(svc.deleteTeam).not.toHaveBeenCalled();
        expect(screen.getByText('Sure?')).toBeDefined();
        fireEvent.click(screen.getByText('Sure?'));
        expect(svc.deleteTeam).toHaveBeenCalledWith('t1');
    });

    it('surfaces team run failures inline', async () => {
        const svc = makeSvc({
            executeTeam: vi.fn(async () => {
                throw new Error('provider timeout');
            }),
        });
        renderTab(svc);
        fireEvent.change(screen.getByPlaceholderText('Enter task for team...'), {
            target: { value: 'do research' },
        });
        fireEvent.click(screen.getByText('Run'));
        expect(await screen.findByText(/Run failed:/)).toBeDefined();
        expect(screen.getByText(/provider timeout/)).toBeDefined();
    });

    it('navigates inside the SPA instead of full-page reload to debate', () => {
        renderTab(makeSvc());
        fireEvent.click(screen.getByText('Debate'));
        expect(navMock).toHaveBeenCalledWith(expect.stringMatching(/^\/debate\?strategy=/));
    });
});
