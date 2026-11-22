export interface FeedbackEntry {
    id: string;
    agentId: string;
    task: string;
    feedback: string;
    score?: number;
    createdAt: number;
}

export interface SuggestionDelta {
    agentId: string;
    theme: string;
    occurrences: number;
    suggestion: string;
}

/** Aggregate human feedback into reusable prompt-improvement deltas (CrewAI L1). */
export interface IHumanFeedbackService {
    add(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry;
    deltas(agentId?: string): SuggestionDelta[];
    /** Build an improved system prompt from the strongest deltas. */
    improvedPrompt(base: string, agentId: string): string;
}
