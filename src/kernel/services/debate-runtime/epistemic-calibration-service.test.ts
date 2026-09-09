import { describe, it, expect } from 'vitest';
import { EpistemicCalibrationService } from './epistemic-calibration-service';
describe('EpistemicCalibrationService',()=>{
    const s=new EpistemicCalibrationService();
    it('overconfidence',()=>{expect(s.calibrate('certainly definitely true').overconfidence).toBeGreaterThan(0)});
    it('low',()=>{expect(s.calibrate('maybe possibly').overconfidence).toBe(0)});
    it('range',()=>{expect(s.calibrate('test').overconfidence).toBeGreaterThanOrEqual(0)});
});
