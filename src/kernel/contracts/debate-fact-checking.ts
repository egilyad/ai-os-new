// ── Fact Checking (P1) ───────────────────────────────────────────
export interface FactCheckResult { readonly claim: string; readonly verdict: 'true'|'false'|'uncertain'; }
export interface IFactCheckingService { check(claim: string): FactCheckResult; }
