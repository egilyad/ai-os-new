import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthorBadge from './AuthorBadge';

const mockResolve = vi.fn();
vi.mock('../../kernel/services/agent-identity', () => ({
    resolveAgentIdentity: (id: string) => mockResolve(id),
}));
vi.mock('../AgentsPanel/AgentAvatar', () => ({
    AgentAvatar: ({ agentId, name }: { agentId: string; name?: string }) => (
        <span data-testid={`avatar-${agentId}`}>{name}</span>
    ),
}));

describe('AuthorBadge', () => {
    it('renders agent avatar + display name for agent authors', () => {
        mockResolve.mockReturnValue({
            id: 'agent-1',
            displayName: 'Network Engineer',
            avatar: { emoji: '🤖', color: '#3b82f6' },
        });
        render(<AuthorBadge author={{ kind: 'agent', id: 'agent-1', displayName: 'Net' }} />);
        expect(screen.getByTestId('avatar-agent-1')).toBeDefined();
        expect(screen.getByText('Net')).toBeDefined();
    });

    it('shows id fallback when no display name', () => {
        mockResolve.mockReturnValue({
            id: 'agent-2',
            displayName: 'agent-2',
            avatar: { emoji: '🤖', color: '#3b82f6' },
        });
        render(<AuthorBadge author={{ kind: 'agent', id: 'agent-2', displayName: 'agent-2' }} />);
        expect(screen.getByText('agent-2')).toBeDefined();
    });

    it('renders no avatar for human authors', () => {
        mockResolve.mockReturnValue({
            id: 'user-1',
            displayName: 'user-1',
            avatar: { emoji: '🤖', color: '#3b82f6' },
        });
        render(<AuthorBadge author={{ kind: 'human', id: 'user-1', displayName: 'Alice' }} />);
        expect(screen.queryByTestId('avatar-user-1')).toBeNull();
        expect(screen.getByText(/Alice/)).toBeDefined();
    });
});
