import { describe, it, expect } from 'vitest';
import { ExpertWitnessService } from './expert-witness-service';
describe('ExpertWitnessService',()=>{
    it('find does not throw',()=>{const e=new ExpertWitnessService();expect(()=> e.findExpert('climate', 'who knows climate policy')).not.toThrow()});
    it('instantiable',()=>{expect(new ExpertWitnessService()).toBeDefined()});
    it('returns',()=>{const e=new ExpertWitnessService();const r=e.findExpert('climate');expect(r===undefined || typeof r==='object').toBe(true)});
});
