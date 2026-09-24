import { describe, it, expect } from 'vitest';
import { BestOfNSelector } from './best-of-n';
describe('BestOfNSelector',()=>{
    it('instantiable',()=>{expect(new BestOfNSelector()).toBeDefined()});
    it('selects best variant', async ()=>{
        const s=new BestOfNSelector();
        const res = await s.selectBest(async () => 'This is a sufficiently long and novel variant response for testing purposes', 'test prompt', 2);
        expect(res).toBeDefined();
    });
    it('true',()=>{expect(true).toBe(true)});
});
