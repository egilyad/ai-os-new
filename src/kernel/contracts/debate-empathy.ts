// ── Empathy Mirroring (P1) ───────────────────────────────────────
export interface EmpathyMirror { readonly acknowledgement: string; readonly hasEmpathy: boolean; }
export interface IEmpathyService { mirror(opponentPerspective: string): EmpathyMirror; hasEmpathy(text: string): boolean; }
