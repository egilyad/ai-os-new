import type { IEpistemicCalibrationService, CalibrationScore } from '../../contracts/debate-epistemic-calibration';
export class EpistemicCalibrationService implements IEpistemicCalibrationService {
    calibrate(text: string): CalibrationScore {
        const over=(text.match(/\b(certainly|definitely|undoubtedly)\b/gi)||[]).length;
        return { overconfidence: Math.min(1, over*0.3) };
    }
}
