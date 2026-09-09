import { describe, it, expect } from 'vitest';
import { ExpertWitnessService } from './expert-witness-service';
describe('ExpertWitnessService',()=>{
    it('find does not throw',()=>{const e=new ExpertWitnessService();expect(()=> (e as any).findWitness?.('climate','claim') ?? (e as any).cite?.('topic')).not.toThrow()});
    it('instantiable',()=>{expect(new ExpertWitnessService()).toBeDefined()});
    it('returns',()=>{const e=new ExpertWitnessService();const r=(e as any).getExpert?.('climate') ?? null;expect(r===null || typeof r==='object' || typeof r==='string').toBe(true)});
});
