export interface TournamentMatch {
    id: string;
    topic: string;
    participantA: { name: string; role: 'pro' | 'con' | 'neutral' };
    participantB: { name: string; role: 'pro' | 'con' | 'neutral' };
    winner?: 'A' | 'B' | 'draw';
    status: 'pending' | 'active' | 'completed';
    strategy?: string;
    rounds?: number;
    argumentCount?: number;
    convergenceScore?: number;
    summary?: string;
}

export interface TournamentRound {
    name: string;
    matches: TournamentMatch[];
}

export interface TournamentBracket {
    title: string;
    rounds: TournamentRound[];
}
