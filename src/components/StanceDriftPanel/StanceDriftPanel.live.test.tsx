import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StanceDriftPanel from './StanceDriftPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { DebateSession } from '../../kernel/contracts/debate-types';

vi.mock('../../hooks/useRealAgents', () => {
    const A = [
        { id: 'alice', name: 'Alice (Pro)', role: 'agent' },
        { id: 'bob', name: 'Bob (Con)', role: 'agent' },
        { id: 'carol', name: 'Carol (Neutral)', role: 'agent' },
    ];
    return { useRealAgents: () => A };
});

// Minimal real-debate session: alice flips from strong-pro to strong-con (goalpost shift),
// bob stays neutral. Used to prove the panel auto-analyzes LIVE debate arguments.
const SESSION = {
    id: 'live-debate-1',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'We must immediately implement solar — it is absolutely necessary and urgent; we should act now to solve the crisis!', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'We should analyze and consider all options carefully before deciding.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
        { id: 'a2', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Perhaps we could maybe gradually consider solar — it seems unclear; we should analyze and ponder it slowly.', confidence: 0.9, timestamp: 3, round: 2, position: 'con', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('StanceDriftPanel — live debate wiring', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('auto-analyzes active debate arguments instead of only demo seed', () => {
        useActiveDebateStore.getState().setSession(SESSION);
        render(<StanceDriftPanel />);

        // Button reflects the real argument count from the live session.
        const btn = screen.getByText(/Load active debate/i);
        expect(btn.textContent).toContain('(3)');

        // The panel auto-loaded the real debate and detected alice's stance shift
        // (pro/urgent r1 -> hedged r2) — proving live args flow into the tracker.
        expect(document.body.textContent).toMatch(/Drift events — 1 for Alice/i);
    });
});
