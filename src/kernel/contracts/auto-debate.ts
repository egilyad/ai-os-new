import type { DebateParticipant, DebateSession, DebateRole } from './debate-types';

export interface AutoDebateOptions {
    topic?: string;
    category?: string;
    participants?: DebateParticipant[];
    maxParticipants?: number;
    strategy?: 'round_robin' | 'moderated' | 'free_for_all';
    maxRounds?: number;
}

export interface AutoDebateResult {
    id: string;
    timestamp: number;
    topic: string;
    strategy: string;
    maxRounds: number;
    participants: Array<{
        id: string;
        name: string;
        provider: string;
        role: DebateRole;
    }>;
    session: DebateSession | null;
    durationMs: number;
    completed: boolean;
    error?: string;
}

export interface ProviderWinRate {
    provider: string;
    debates: number;
    wins: number;
    losses: number;
    winRate: number;
    avgTokens: number;
    avgLatency: number;
    avgCost: number;
}

export interface BatchTestResult {
    topic: string;
    runs: number;
    results: AutoDebateResult[];
    winRates: ProviderWinRate[];
}

export interface TournamentMatch {
    pairId: string;
    participantA: string;
    participantB: string;
    topic: string;
    winner: string | null;
    draw: boolean;
    completed: boolean;
    sessionStatus?: string;
    durationMs: number;
    error?: string;
}

export interface TournamentResult {
    id: string;
    topic: string;
    participants: string[];
    matches: TournamentMatch[];
    rankings: { name: string; wins: number; losses: number; score: number }[];
    completed: boolean;
    timestamp: number;
    durationMs: number;
}

export interface IAutoDebateService {
    runAutoDebate(options?: AutoDebateOptions): Promise<AutoDebateResult>;
    runQuickTest(): Promise<AutoDebateResult>;
    stressTest(count?: number): Promise<AutoDebateResult[]>;
    batchTest(topic: string, runs?: number): Promise<BatchTestResult>;
    runTournament(topic: string, participants?: number): Promise<TournamentResult>;
    getResults(): AutoDebateResult[];
    getWinRates(): ProviderWinRate[];
    clearResults(): void;
}
