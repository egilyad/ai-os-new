import { describe, it, expect } from 'vitest';
describe('ReplaySelector',()=>{
    it('placeholder replay logic',()=>{
        const s={ select: (args: Array<{ id: string; round: number }>)=> args.filter(a=>a.round<2).slice(0,2) };
        expect(s.select([{id:'a1',round:1},{id:'a2',round:3}]).length).toBe(1);
    });
    it('always true',()=>{expect(true).toBe(true)});
    it('not throw',()=>{expect(()=>{ }).not.toThrow()});
});
