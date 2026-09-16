// ── Hegelian Synthesis (P1) ───────────────────────────────────────
export interface DialecticSynthesis { readonly thesis: string; readonly antithesis: string; readonly synthesis: string; }
export interface IHegelianService { synthesize(thesis: string, antithesis: string): DialecticSynthesis | null; }
