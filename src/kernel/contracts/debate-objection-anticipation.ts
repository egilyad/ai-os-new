// ── Objection Anticipation (P0/P2) ─────────────────────────────────
export interface ObjectionSlot { readonly objection: string; readonly prebuttal: string; }
export interface IObjectionAnticipationService { anticipate(claim: string): ObjectionSlot | null; }
