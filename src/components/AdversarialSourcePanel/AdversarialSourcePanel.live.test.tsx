import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdversarialSourcePanel from './AdversarialSourcePanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { DebateSession } from '../../kernel/contracts/debate-types';

const SESSION = {
    id: 'live-debate-src',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Solar LCOE $24/MWh — cheapest per Lazard, but seasonal variability not solved.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Nuclear 92% capacity factor vs 24% solar — intermittency dominates winter.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('AdversarialSourcePanel — live debate wiring', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('loads active debate arguments into the source text', () => {
        useActiveDebateStore.getState().setSession(SESSION);
        const { container } = render(<AdversarialSourcePanel />);

        expect(document.body.textContent).toContain('Active debate: Solar energy policy');

        fireEvent.click(screen.getByText(/Load active debate/i));
        const ta = container.querySelector('textarea') as HTMLTextAreaElement;
        expect(ta.value).toContain('Solar LCOE $24/MWh');
        expect(ta.value).toContain('Nuclear 92% capacity factor');
    });
});
