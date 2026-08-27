// ── Role-Reversal (P2) ───────────────────────────────────────────
export interface ReversalPrompt { readonly flipped: string; }
export interface IRoleReversalService { flip(perspective: string): ReversalPrompt; }
