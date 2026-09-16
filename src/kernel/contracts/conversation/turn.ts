export interface TurnProposal {
    participantId: string;
    objective: {
        type:
            'INTRODUCE' | 'CRITIQUE' | 'RESPOND' | 'ANALYZE' | 'SUMMARIZE' | 'CHALLENGE' | 'CUSTOM';
        description: string;
        constraints: string[];
    };
    targetTurnId?: string;
}

export interface Turn {
    id: string;
    proposal: TurnProposal;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    createdAt: number;
}
