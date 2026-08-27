import { describe, it, expect } from 'vitest';
import { SemanticBlendingService } from './semantic-blending-service';
describe('SemanticBlendingService',()=>{
    const s=new SemanticBlendingService();
    it('blend',()=>{expect(s.blend('solar','nuclear').blended).toContain('blended')});
    it('has',()=>{expect(s.blend('a','b').blended.length).toBeGreaterThan(0)});
    it('not throw',()=>{expect(()=>s.blend('','')).not.toThrow()});
});
