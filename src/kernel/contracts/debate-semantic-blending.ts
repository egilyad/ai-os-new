// ── Semantic Blending (P1) ───────────────────────────────────────
export interface BlendResult { readonly blended: string; }
export interface ISemanticBlendingService { blend(a: string, b: string): BlendResult; }
