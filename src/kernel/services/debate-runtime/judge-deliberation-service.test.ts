import { describe, it, expect } from 'vitest';
import { JudgeDeliberationService } from './judge-deliberation-service';
describe('JudgeDeliberationService',()=>{
    const s=new JudgeDeliberationService();
    it('deliberate',()=>{expect(s.deliberate([0.6,0.8]).score).toBeCloseTo(0.7,1)});
    it('empty',()=>{expect(s.deliberate([]).score).toBe(0)});
    it('consensus',()=>{expect(s.deliberate([1]).consensus).toContain('Consensus')});
});
