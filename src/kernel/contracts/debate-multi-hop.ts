// ── Multi-Hop Reasoning (P1) ─────────────────────────────────────
export interface MultiHopCheck { readonly hops: number; readonly isMultiHop: boolean; }
export interface IMultiHopService { check(text: string): MultiHopCheck; }
