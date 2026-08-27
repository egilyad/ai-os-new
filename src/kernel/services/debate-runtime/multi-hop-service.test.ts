import { describe, it, expect } from 'vitest';
import { MultiHopService } from './multi-hop-service';
describe('MultiHopService',()=>{
    const s=new MultiHopService();
    it('counts hops',()=>{expect(s.check('A because B therefore C so D').hops).toBeGreaterThanOrEqual(3)});
    it('isMultiHop',()=>{expect(s.check('Simple claim.').isMultiHop).toBe(false);expect(s.check('A because B therefore C thus D hence E').isMultiHop).toBe(true)});
    it('has hops',()=>{expect(s.check('test').hops).toBeGreaterThan(0)});
});
