// ── Heat Detection (P1) ──────────────────────────────────────────
export interface HeatLevel { readonly level: number; readonly label: 'low' | 'medium' | 'high'; }
export interface IHeatDetectionService { detect(text: string): HeatLevel; detectHistory(texts: string[]): HeatLevel; }
