import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MinimaxPlannerPanel from './MinimaxPlannerPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { DebateSession } from '../../kernel/contracts/debate-types';

// 3 real-debate arguments (fallback has 5) — used to prove the graph is rebuilt from live args.
const SESSION = {
    id: 'live-debate-3',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Solar LCOE $24/MWh — cheapest per Lazard.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Nuclear 92% capacity factor vs 24% solar — intermittency.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
        { id: 'a2', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Storage + HVDC solves intermittency — DESERTEC 90% feasible.', confidence: 0.9, timestamp: 3, round: 2, position: 'pro', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('MinimaxPlannerPanel — live debate wiring', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('rebuilds the argument graph from active debate arguments', () => {
        useActiveDebateStore.getState().setSession(SESSION);
        render(<MinimaxPlannerPanel />);

        // Button reflects the real argument count.
        const btn = screen.getByText(/Load active debate/i);
        expect(btn.textContent).toContain('(3)');

        // The graph was rebuilt from the 3 live arguments (fallback would be 5 nodes).
        expect(document.body.textContent).toMatch(/3 nodes/i);
    });
});
