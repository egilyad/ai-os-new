import { describe, it, expect } from 'vitest';
import { SentinelService } from './sentinel-service';
describe('SentinelService',()=>{
    const s=new SentinelService();
    it('finds abandoned',()=>{const a=[{id:'a1',agentId:'alice',content:'claim one',round:1},{id:'a2',agentId:'alice',content:'claim two',round:4},{id:'b1',agentId:'bob',content:'other',round:4}];expect(s.findAbandoned('alice',a).length).toBeGreaterThan(0)});
    it('empty when recent',()=>{expect(s.findAbandoned('alice',[{id:'a1',agentId:'alice',content:'hi',round:4},{id:'b1',agentId:'bob',content:'hi',round:4}])).toEqual([])});
    it('no throw empty',()=>{expect(s.findAbandoned('alice',[])).toEqual([])});
});
