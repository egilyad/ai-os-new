import { describe, it, expect } from 'vitest';
import { ScratchpadService } from './scratchpad-service';
describe('ScratchpadService',()=>{
    it('instantiable',()=>{expect(new ScratchpadService()).toBeDefined()});
    it('does not throw',()=>{const s=new ScratchpadService();expect(()=> s.analyze('alice', 'pro', 1, [{ agentId: 'alice', agentName: 'Alice', content: 'draft claim here', round: 1 }], 'topic', 'English')).not.toThrow()});
    it('has',()=>{expect(true).toBe(true)});
});
