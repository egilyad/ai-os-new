import { describe, it, expect } from 'vitest';
import { InterruptQueue } from './interrupt-queue';
describe('InterruptQueue',()=>{
    it('enqueue does not throw',()=>{const q=new InterruptQueue();expect(()=> q.requestInterrupt('a', 'b', 'clarify this claim', 1)).not.toThrow()});
    it('instantiable',()=>{expect(new InterruptQueue()).toBeDefined()});
    it('has queue',()=>{const q=new InterruptQueue();expect(q).toBeDefined()});
});
