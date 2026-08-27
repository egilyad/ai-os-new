// ── Epistemic Calibration (P1) ───────────────────────────────────
export interface CalibrationScore { readonly overconfidence: number; }
export interface IEpistemicCalibrationService { calibrate(text: string): CalibrationScore; }
