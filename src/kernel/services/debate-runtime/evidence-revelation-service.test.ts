import { describe, it, expect } from 'vitest';
import { EvidenceRevelationService } from './evidence-revelation-service';
describe('EvidenceRevelationService',()=>{
    const s=new EvidenceRevelationService();
    it('stage',()=>{expect(s.stage(1,['e1','e2'])?.evidence).toBe('e1')});
    it('null empty',()=>{expect(s.stage(1,[])).toBeNull()});
    it('not throw',()=>{expect(()=>s.stage(2,['a','b','c'])).not.toThrow()});
});
