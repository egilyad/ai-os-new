import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DebateChat from './DebateChat';

vi.mock('../../kernel/services/agent-identity', () => ({
    resolveAgentIdentity: (id: string) => ({ displayName: id }),
}));

afterEach(() => cleanup());

const t = (k: string) => k;

describe('DebateChat waiting state (Zone 2)', () => {
    it('shows a waiting cue instead of a blank area before the first argument', () => {
        render(<DebateChat arguments={[]} t={t} />);
        expect(screen.getByText('Waiting for the first argument…')).toBeDefined();
    });

    it('still shows the all-failed banner when every agent errored', () => {
        render(
            <DebateChat
                arguments={[]}
                t={t}
                agentErrors={[{ agentId: 'a', error: 'x', timestamp: 1 }]}
            />,
        );
        expect(screen.getByText('debate.all_agents_failed')).toBeDefined();
        expect(screen.queryByText('Waiting for the first argument…')).toBeNull();
    });
});
