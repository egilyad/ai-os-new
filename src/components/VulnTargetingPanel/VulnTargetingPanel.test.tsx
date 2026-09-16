import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VulnTargetingPanel from './VulnTargetingPanel';
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

const SESSION = {
    id: 'live-vuln-1',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'Solar is the most cost-effective solution and deployment scales linearly across grids.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Solar intermittency is overstated and storage covers most gaps for typical demand.', confidence: 0.85, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
        { id: 'a2', agentId: 'alice', agentName: 'Alice (Pro)', content: 'HVDC interconnects smooth output across time zones and reduce variability substantially.', confidence: 0.88, timestamp: 3, round: 2, position: 'pro', source: 'llm' as const },
        { id: 'b2', agentId: 'bob', agentName: 'Bob (Con)', content: 'Silver and lithium extraction limits undermine scaling at three times current deployment.', confidence: 0.8, timestamp: 4, round: 2, position: 'con', source: 'llm' as const },
        { id: 'c1', agentId: 'carol', agentName: 'Carol (Neutral)', content: 'We should evaluate both sides and consider a balanced portfolio of options.', confidence: 0.7, timestamp: 5, round: 2, position: 'neutral', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('VulnTargetingPanel', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('renders header', () => {
        render(<VulnTargetingPanel />);
        expect(screen.getAllByText(/Vuln Targeting/i).length).toBeGreaterThan(0);
    });
    it('shows graph stats', () => {
        render(<VulnTargetingPanel />);
        expect(document.body.textContent).toContain('Graph');
        expect(document.body.textContent).toContain('nodes');
    });
    it('finds vulnerabilities for attacker from live debate', async () => {
        useActiveDebateStore.getState().setSession(SESSION);
        render(<VulnTargetingPanel />);
        await waitFor(() => expect(document.body.textContent).toContain('nodes 5'), { timeout: 3000 });
        expect(document.body.textContent).toContain('Vulnerabilities');
    });
    it('adds claim and rebuilds', () => {
        render(<VulnTargetingPanel />);
        const input = screen.getByDisplayValue(/However the opponent claim/i) as HTMLInputElement;
        expect(input).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Add claim/i }));
        expect(document.body.textContent).toContain('nodes');
    });
});
