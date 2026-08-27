// ── Argument Sentinel (P1) ───────────────────────────────────────
export interface AbandonedClaim { readonly claimId: string; readonly text: string; readonly roundsSince: number; }
export interface ISentinelService { findAbandoned(agentId: string, args: Array<{id:string;agentId:string;content:string;round:number}>): AbandonedClaim[]; }
