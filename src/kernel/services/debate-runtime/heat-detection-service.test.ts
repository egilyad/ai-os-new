import { describe, it, expect } from 'vitest';
import { HeatDetectionService } from './heat-detection-service';
describe('HeatDetectionService',()=>{
    const s=new HeatDetectionService();
    it('low heat calm',()=>{expect(s.detect('We should consider solar options calmly.').label).toBe('low')});
    it('high heat caps and exclaim',()=>{expect(s.detect('THIS IS A DISASTER!!! Absolutely never!').label).toBe('high')});
    it('history average',()=>{expect(s.detectHistory(['calm','THIS IS DISASTER!!!']).level).toBeGreaterThan(0)});
});
