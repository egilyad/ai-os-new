import { describe, it, expect } from 'vitest';
import { StatusDynamicsService } from './status-dynamics-service';
describe('StatusDynamicsService',()=>{
    const s=new StatusDynamicsService();
    it('assign',()=>{expect(s.assign(['a','b','c']).length).toBe(3)});
    it('levels decreasing',()=>{const r=s.assign(['a','b']);expect(r[0].level).toBeGreaterThan(r[1].level)});
    it('not throw',()=>{expect(()=>s.assign([])).not.toThrow()});
});
