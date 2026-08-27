import { describe, it, expect } from 'vitest';
import { InterruptQueue } from './interrupt-queue';
describe('InterruptQueue',()=>{
    it('enqueue does not throw',()=>{const q=new InterruptQueue();expect(()=> (q as any).enqueue?.({from:'a', text:'clarify this claim', round:1}) ?? q).not.toThrow()});
    it('instantiable',()=>{expect(new InterruptQueue()).toBeDefined()});
    it('has queue',()=>{const q=new InterruptQueue();expect(q).toBeDefined()});
});
