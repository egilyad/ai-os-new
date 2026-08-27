// ── Prediction Market (P2) ───────────────────────────────────────
export interface MarketPrediction { readonly agentId: string; readonly predictedWinner: string; readonly confidence: number; }
export interface IPredictionMarketService { predict(agents: string[], topic: string): MarketPrediction[]; }
