import { describe, it, expect } from 'vitest';
import { TriangulationService } from './triangulation-service';
describe('TriangulationService',()=>{
    const s=new TriangulationService();
    it('triangulated with diverse',()=>{expect(s.check(['https://nature.com/a','https://reuters.com/b']).isTriangulated).toBe(true)});
    it('not triangulated single',()=>{expect(s.check(['blog']).isTriangulated).toBe(false)});
    it('confidence range',()=>{expect(s.check(['https://nature.com/a','https://reuters.com/b']).confidence).toBeGreaterThan(0)});
});
