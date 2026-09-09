import { describe, it, expect } from 'vitest';
import { SocraticPivotService } from './socratic-pivot-service';
describe('SocraticPivotService',()=>{
    const s=new SocraticPivotService();
    it('pivot',()=>{expect(s.pivot('We should ban cars because they pollute').question).toContain('hidden assumption')});
    it('null short',()=>{expect(s.pivot('hi')).toBeNull()});
    it('not throw',()=>{expect(()=>s.pivot('')).not.toThrow()});
});
