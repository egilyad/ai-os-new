// ── Dynamic Alliance (P2) ────────────────────────────────────────
export interface Alliance { readonly members: string[]; readonly strength: number; }
export interface IAllianceService { form(agentIds: string[], topic: string): Alliance | null; }
