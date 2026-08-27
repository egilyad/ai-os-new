// ── Adaptive Order (P2) ──────────────────────────────────────────
export interface Order { readonly order: string[]; }
export interface IAdaptiveOrderService { order(agentIds: string[], scores: number[]): Order; }
