// ── Uncertainty Propagation (P1) ───────────────────────────────────
export interface UncertaintyNode { readonly claim: string; readonly confidence: 'high'|'medium'|'low'; }
export interface IUncertaintyPropagationService { propagate(nodes: UncertaintyNode[]): UncertaintyNode[]; }
