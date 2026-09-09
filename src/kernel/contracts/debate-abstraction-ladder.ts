// ── Abstraction Ladder (P2) ─────────────────────────────────────
export interface LadderStep { readonly level: 'concrete'|'abstract'; readonly text: string; }
export interface IAbstractionLadderService { ladder(text: string): LadderStep[]; }
