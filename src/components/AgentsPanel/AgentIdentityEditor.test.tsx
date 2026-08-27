import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentIdentityEditor from './AgentIdentityEditor';

const mockResolve = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../../kernel/services/agent-identity', () => ({
    resolveAgentIdentity: (id: string) => mockResolve(id),
}));

vi.mock('../../kernel/instances/services-extras', () => ({
    lensEngine: { listLenses: () => [{ id: 'lens-1', name: 'Critical' }] },
}));

vi.mock('./AgentAvatar', () => ({
    AgentAvatar: () => <div data-testid="mock-avatar" />,
}));

const baseIdentity = {
    id: 'agent-1',
    displayName: 'Alpha Agent',
    firstName: 'Alpha',
    lastName: 'Bot',
    baseRole: 'Research Analyst',
    specializations: ['Chemistry'],
    lensIds: [],
    lensNames: [],
    model: 'gpt-4',
    provider: 'openai',
    providerName: 'OpenAI',
    avatar: { emoji: '🤖', color: '#64748b' },
    systemPrompt: 'Test prompt',
};

const t = (key: string) => key;

beforeEach(() => {
    mockResolve.mockReset();
    mockResolve.mockReturnValue({ ...baseIdentity });
    mockUpdate.mockReset();
});

describe('AgentIdentityEditor', () => {
    it('renders prefilled identity fields', () => {
        render(<AgentIdentityEditor agentId="agent-1" onUpdateAgent={mockUpdate} t={t} />);
        expect(
            (screen.getByLabelText('agents.identity.display_name') as HTMLInputElement).value,
        ).toBe('Alpha Agent');
        expect((screen.getByLabelText('agents.identity.base_role') as HTMLInputElement).value).toBe(
            'Research Analyst',
        );
    });

    it('writes merged config through onUpdateAgent on save', async () => {
        render(<AgentIdentityEditor agentId="agent-1" onUpdateAgent={mockUpdate} t={t} />);
        const displayName = screen.getByLabelText(
            'agents.identity.display_name',
        ) as HTMLInputElement;
        fireEvent.change(displayName, { target: { value: 'Renamed Agent' } });

        fireEvent.click(screen.getByText('agents.identity.save'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });
        const call = mockUpdate.mock.calls[0]!;
        const [id, updates] = call;
        expect(id).toBe('agent-1');
        expect(updates.displayName).toBe('Renamed Agent');
        expect(updates.baseRole).toBe('Research Analyst');
        expect(updates.lensIds).toEqual([]);
        expect(updates.avatar).toEqual({ emoji: '🤖', color: '#64748b' });

        expect(screen.getByText('agents.identity.saved')).toBeDefined();
    });

    it('parses comma-separated specializations', async () => {
        render(<AgentIdentityEditor agentId="agent-1" onUpdateAgent={mockUpdate} t={t} />);
        const specs = screen.getByLabelText('agents.identity.specializations') as HTMLInputElement;
        fireEvent.change(specs, { target: { value: 'Chemistry, Security' } });
        fireEvent.click(screen.getByText('agents.identity.save'));

        await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
        expect(mockUpdate.mock.calls[0]![1].specializations).toEqual(['Chemistry', 'Security']);
    });

    it('emits avatar url when provided', async () => {
        render(<AgentIdentityEditor agentId="agent-1" onUpdateAgent={mockUpdate} t={t} />);
        const url = screen.getByLabelText('agents.identity.avatar_url') as HTMLInputElement;
        fireEvent.change(url, { target: { value: 'https://x/y.png' } });
        fireEvent.click(screen.getByText('agents.identity.save'));

        await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
        expect(mockUpdate.mock.calls[0]![1].avatar).toEqual({ url: 'https://x/y.png' });
    });
});
