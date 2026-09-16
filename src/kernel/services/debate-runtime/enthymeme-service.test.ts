import { describe, it, expect } from 'vitest';
import { EnthymemeService } from './enthymeme-service';
describe('EnthymemeService',()=>{
    const s=new EnthymemeService();
    it('finds gaps',()=>{expect(s.findGaps('We should ban all cars because it is good').length).toBeGreaterThan(0)});
    it('no gaps clean',()=>{expect(s.findGaps('According to study 2023, with data 42, we conclude X.')).toEqual([])});
    it('array',()=>{expect(Array.isArray(s.findGaps('test'))).toBe(true)});
});
