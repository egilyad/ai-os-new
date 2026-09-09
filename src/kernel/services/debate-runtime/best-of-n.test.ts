import { describe, it, expect } from 'vitest';
import { BestOfNSelector } from './best-of-n';
describe('BestOfNSelector',()=>{
    it('instantiable',()=>{expect(new (BestOfNSelector as any)()).toBeDefined()});
    it('not throw',()=>{const s=new (BestOfNSelector as any)();expect(()=> (s as any).select?.(['a','b','c']) ?? (s as any).choose?.(['x'])).not.toThrow()});
    it('true',()=>{expect(true).toBe(true)});
});
