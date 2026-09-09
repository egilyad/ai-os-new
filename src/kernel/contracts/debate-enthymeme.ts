// ── Enthymeme Attack (P1) ────────────────────────────────────────
export interface EnthymemeGap { readonly premise: string; readonly hidden: string; }
export interface IEnthymemeService { findGaps(text: string): EnthymemeGap[]; }
