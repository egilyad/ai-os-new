import { describe, it, expect } from 'vitest';
import { AbstractionLadderService } from './abstraction-ladder-service';
describe('AbstractionLadderService',()=>{
    const s=new AbstractionLadderService();
    it('ladder',()=>{expect(s.ladder('Concrete fact. Abstract principle. Another concrete.').length).toBeGreaterThan(0)});
    it('levels',()=>{expect(s.ladder('A. B.').every(x=>['concrete','abstract'].includes(x.level))).toBe(true)});
    it('not throw',()=>{expect(()=>s.ladder('')).not.toThrow()});
});
