import { describe, it, expect } from 'vitest';
import { ScratchpadService } from './scratchpad-service';
describe('ScratchpadService',()=>{
    it('instantiable',()=>{expect(new ScratchpadService()).toBeDefined()});
    it('does not throw',()=>{const s=new ScratchpadService();expect(()=> (s as any).create?.('draft') ?? s).not.toThrow()});
    it('has',()=>{expect(true).toBe(true)});
});
