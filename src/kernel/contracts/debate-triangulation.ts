// ── Triangulation (P1) ───────────────────────────────────────────
// Cross-reference claims against multiple independent sources.
export interface TriangulationCheck { readonly sourceCount: number; readonly isTriangulated: boolean; readonly confidence: number; }
export interface ITriangulationService { check(sources: string[]): TriangulationCheck; }
