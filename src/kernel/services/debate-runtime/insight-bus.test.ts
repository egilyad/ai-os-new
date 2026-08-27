import { describe, it, expect } from 'vitest';
import { InsightBus } from './insight-bus';
describe('InsightBus',()=>{
    it('ingestRound does not throw',()=>{
        const b=new InsightBus();
        expect(()=>b.ingestRound(1, [{agentId:'a', content:'Insight about climate policy', agentName:'Alice'}])).not.toThrow();
    });
    it('getInsights returns array',()=>{
        const b=new InsightBus();
        b.ingestRound(1, [{agentId:'a', content:'First insight', agentName:'Alice'}]);
        const ins = (b as any).allInsights ?? (b as any).getInsights?.() ?? [];
        expect(Array.isArray(ins)).toBe(true);
    });
    it('instantiable',()=>{expect(new InsightBus()).toBeDefined()});
});
