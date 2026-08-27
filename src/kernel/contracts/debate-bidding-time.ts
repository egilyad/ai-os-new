// ── Bidding Time (P2) ────────────────────────────────────────────
export interface Bid { readonly agentId: string; readonly bid: number; }
export interface IBiddingTimeService { rank(bids: Bid[]): string[]; }
