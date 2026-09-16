// ── Socratic Pivot (P1) ──────────────────────────────────────────
export interface PivotQuestion { readonly question: string; }
export interface ISocraticPivotService { pivot(opponentClaim: string): PivotQuestion | null; }
