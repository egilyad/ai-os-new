import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SteelmanPanel from './SteelmanPanel';
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
    id: 'live-steelman-1',
    topic: 'Solar energy policy',
    arguments: [
        { id: 'a1', agentId: 'alice', agentName: 'Alice (Pro)', content: 'We must immediately implement solar — it is absolutely necessary and urgent.', confidence: 0.9, timestamp: 1, round: 1, position: 'pro', source: 'llm' as const },
        { id: 'b1', agentId: 'bob', agentName: 'Bob (Con)', content: 'Solar intermittency is real and storage is not yet sufficient for winter peaks across northern grids in practice.', confidence: 0.5, timestamp: 2, round: 1, position: 'con', source: 'llm' as const },
    ],
} as unknown as DebateSession;

describe('SteelmanPanel', () => {
    afterEach(() => {
        useActiveDebateStore.getState().clearAll();
    });

    it('renders header and agent picker', () => {
        render(<SteelmanPanel />);
        expect(screen.getAllByText(/Steelman/i).length).toBeGreaterThan(0);
        expect(screen.getByDisplayValue('Alice (Pro)')).toBeDefined();
    });
    it('shows recommended target and allows picker', async () => {
        useActiveDebateStore.getState().setSession(SESSION);
        render(<SteelmanPanel />);
        await waitFor(() => expect(document.body.textContent).toContain('Scores'));
        const bars = document.querySelectorAll('[style*="cursor: pointer"]');
        expect(bars.length).toBeGreaterThan(0);
    });
    it('picker changes on agent switch', () => {
        render(<SteelmanPanel />);
        const select = screen.getByDisplayValue('Alice (Pro)') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'bob' } });
        expect((screen.getByDisplayValue('Bob (Con)') as HTMLSelectElement).value).toBe('bob');
    });
});
