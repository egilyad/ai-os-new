// ── Redundancy Detector (P1) ─────────────────────────────────────
export interface RedundancyReport { readonly isRedundant: boolean; readonly similarity: number; readonly priorId?: string; }
export interface IRedundancyService { check(current: string, previous: string[]): RedundancyReport; }
