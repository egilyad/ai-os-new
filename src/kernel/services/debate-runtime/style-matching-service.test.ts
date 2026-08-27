import { describe, it, expect } from 'vitest';
import { StyleMatchingService } from './style-matching-service';
describe('StyleMatchingService',()=>{
    const s=new StyleMatchingService();
    it('formal',()=>{expect(s.match('Therefore, however, moreover, the formal argument.').formal).toBeGreaterThan(0.5)});
    it('emotive',()=>{expect(s.match('Amazing! Terrible! Love it! Hate it!').emotive).toBeGreaterThan(0.3)});
    it('sum 1',()=>{const r=s.match('Therefore amazing!');expect(r.formal+r.emotive).toBeCloseTo(1,1)});
});
