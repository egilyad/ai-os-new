import { describe, it, expect } from 'vitest';
import { RoleReversalService } from './role-reversal-service';
describe('RoleReversalService',()=>{
    const s=new RoleReversalService();
    it('flip',()=>{expect(s.flip('We support solar').flipped).toContain('Opposite')});
    it('has flipped',()=>{expect(s.flip('test').flipped.length).toBeGreaterThan(0)});
    it('not throw',()=>{expect(()=>s.flip('')).not.toThrow()});
});
