// ── Evidence Revelation (P2) ─────────────────────────────────────
export interface RevealStage { readonly round: number; readonly evidence: string; }
export interface IEvidenceRevelationService { stage(round: number, allEvidence: string[]): RevealStage | null; }
