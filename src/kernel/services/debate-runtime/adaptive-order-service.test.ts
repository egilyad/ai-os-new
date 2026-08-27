import { describe, it, expect } from 'vitest';
import { AdaptiveOrderService } from './adaptive-order-service';
describe('AdaptiveOrderService',()=>{
    const s=new AdaptiveOrderService();
    it('order by score',()=>{expect(s.order(['a','b'],[0.2,0.9]).order).toEqual(['b','a'])});
    it('empty',()=>{expect(s.order([],[]).order).toEqual([])});
    it('not throw',()=>{expect(()=>s.order(['a'],[1])).not.toThrow()});
});
