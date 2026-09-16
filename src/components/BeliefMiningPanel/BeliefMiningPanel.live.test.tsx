import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BeliefMiningPanel from './BeliefMiningPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { DebateSession } from '../../kernel/contracts/debate-types';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

// 3 real-debate arguments — used to prove live args replace any empty default.
const SESSION = {
    id: 'live-debate-2',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'We must protect freedom and justice — solar is good and beneficial for welfare.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Solar is harmful and dangerous for the grid — it is bad and costly.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
        { id: 'a2', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Because solar causes lower emissions, it leads to cleaner air. Science shows studies prove this.', confidence: 0.9, timestamp: 3, round: 2, position: 'pro', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('BeliefMiningPanel — live debate wiring', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('auto-loads active debate arguments instead of an empty default', () => {
        useActiveDebateStore.getState().setSession(SESSION);
        render(<BeliefMiningPanel />);

        // Button reflects the real argument count.
        const btn = screen.getByText(/Load active debate/i);
        expect(btn.textContent).toContain('(3)');

        // The panel analyzed the live arguments (3), not an empty default.
        expect(document.body.textContent).toMatch(/from 3 args/i);
    });
});
