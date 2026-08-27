// ── Self-Critic (P1) ─────────────────────────────────────────────
// Pre-validate own argument before submission.

export interface CriticFeedback {
    readonly issue: string;
    readonly severity: 'low' | 'medium' | 'high';
    readonly suggestion: string;
}

export interface ICriticService {
    critique(text: string): CriticFeedback[];
    passes(text: string): boolean;
}
