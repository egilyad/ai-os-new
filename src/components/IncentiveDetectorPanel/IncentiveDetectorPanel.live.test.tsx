import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IncentiveDetectorPanel from './IncentiveDetectorPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { DebateSession } from '../../kernel/contracts/debate-types';

vi.mock('../../kernel/instances/services-core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../kernel/instances/services-core')>();
    return {
        ...actual,
        agentService: {
            getAgents: () => ([
                { id: 'agent-1', name: 'Agent One', role: 'agent' },
                { id: 'agent-2', name: 'Agent Two', role: 'agent' },
            ]),
        },
    };
});

const SESSION = {
    id: 'live-debate-inc',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Subsidize solar — boosts profit for investors and market growth for AI companies.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Pharma and hospitals profit from drug pricing while workers bear costs.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('IncentiveDetectorPanel — live debate wiring', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('shows the active debate topic and loads it into the topic field', () => {
        useActiveDebateStore.getState().setSession(SESSION);
        const { container } = render(<IncentiveDetectorPanel />);

        // The live debate topic is surfaced in the panel.
        expect(document.body.textContent).toContain('Active debate: Solar energy policy');

        // Loading pulls the live topic into the topic input.
        fireEvent.click(screen.getByText(/Load active debate/i));
        const topicInput = Array.from(container.querySelectorAll('input')).find(
            (i) => i.value === 'Solar energy policy',
        );
        expect(topicInput).toBeTruthy();
    });
});
