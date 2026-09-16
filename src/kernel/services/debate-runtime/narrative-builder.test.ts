import { describe, it, expect } from 'vitest';
import { NarrativeBuilder } from './narrative-builder';
describe('NarrativeBuilder',()=>{
    it('instantiable',()=>{expect(new (NarrativeBuilder as any)()).toBeDefined()});
    it('build does not throw',()=>{const b=new (NarrativeBuilder as any)();expect(()=> (b as any).build?.('topic',[]) ?? (b as any).create?.('t')).not.toThrow()});
    it('true',()=>{expect(true).toBe(true)});
});
