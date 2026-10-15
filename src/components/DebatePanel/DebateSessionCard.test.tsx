import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DebateSessionCard from './DebateSessionCard';
import { getConclusionType } from './debate-memory-helpers';
import type { DebateSession } from '../../kernel/contracts/debate-types';

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        sessionManager: { getDebateHistory: () => [] },
        debateService: { getActiveDebateSession: () => null },
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function session(over: Partial<DebateSession> = {}): DebateSession {
    return {
        id: 's1',
        topic: 't',
        status: 'completed',
        currentRound: 3,
        maxRounds: 5,
        convergenceScore: 50,
        participants: [],
        arguments: [],
        createdAt: 1000,
        ...over,
    } as DebateSession;
}

describe('DebateSessionCard convergence scale (Zone 2)', () => {
    it('renders 0..100 scores as-is, not multiplied', () => {
        render(<DebateSessionCard session={session()} isExpanded={true} onToggle={vi.fn()} />);
        expect(screen.getByText('Convergence: 50%')).toBeDefined();
        expect(screen.queryByText('Convergence: 5000%')).toBeNull();
    });
});

describe('getConclusionType bands (Zone 2)', () => {
    it('uses the 0..100 governor scale like the color bands', () => {
        expect(getConclusionType(80)).toBe('consensus');
        expect(getConclusionType(50)).toBe('dominance');
        expect(getConclusionType(10)).toBe('inconclusive');
        expect(getConclusionType(undefined)).toBe('inconclusive');
    });
});
