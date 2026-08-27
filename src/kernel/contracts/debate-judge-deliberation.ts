// ── Judge Deliberation (P2) ──────────────────────────────────────
export interface DeliberationResult { readonly consensus: string; readonly score: number; }
export interface IJudgeDeliberationService { deliberate(scores: number[]): DeliberationResult; }
