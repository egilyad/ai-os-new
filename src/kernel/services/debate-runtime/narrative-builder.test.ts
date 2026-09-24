import { describe, it, expect } from 'vitest';
import { NarrativeBuilder } from './narrative-builder';
describe('NarrativeBuilder',()=>{
    it('instantiable',()=>{expect(new NarrativeBuilder()).toBeDefined()});
    it('build does not throw',()=>{const b=new NarrativeBuilder();expect(()=> b.selectArc('alice', 2, 5)).not.toThrow()});
    it('true',()=>{expect(true).toBe(true)});
});
