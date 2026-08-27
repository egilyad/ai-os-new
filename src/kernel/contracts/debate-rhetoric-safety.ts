// ── Rhetoric Safety (P1) ─────────────────────────────────────────
export interface SafetyFlag { readonly flagged: boolean; readonly reason?: string; }
export interface IRhetoricSafetyService { check(text: string): SafetyFlag; }
