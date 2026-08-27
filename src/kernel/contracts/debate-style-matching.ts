// ── Style Matching (P2) ──────────────────────────────────────────
export interface StyleProfile { readonly formal: number; readonly emotive: number; }
export interface IStyleMatchingService { match(opponentText: string): StyleProfile; }
