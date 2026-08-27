import { describe, it, expect } from 'vitest';
import { BiddingTimeService } from './bidding-time-service';
describe('BiddingTimeService',()=>{
    const s=new BiddingTimeService();
    it('rank',()=>{expect(s.rank([{agentId:'a',bid:1},{agentId:'b',bid:5}])).toEqual(['b','a'])});
    it('empty',()=>{expect(s.rank([])).toEqual([])});
    it('single',()=>{expect(s.rank([{agentId:'x',bid:10}])).toEqual(['x'])});
});
