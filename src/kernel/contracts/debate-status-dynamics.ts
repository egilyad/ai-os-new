// ── Status Dynamics (P2) ─────────────────────────────────────────
export interface StatusLevel { readonly agentId: string; readonly level: number; }
export interface IStatusDynamicsService { assign(agentIds: string[]): StatusLevel[]; }
