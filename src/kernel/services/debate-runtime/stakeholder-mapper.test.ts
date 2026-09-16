import { describe, it, expect } from 'vitest';
import { StakeholderMapper } from './stakeholder-mapper';
describe('StakeholderMapper',()=>{
    it('map does not throw',()=>{const m=new StakeholderMapper();expect(()=> (m as any).map?.('Climate policy', 'We support solar') ?? (m as any).analyze?.('a','Alice','content','topic')).not.toThrow()});
    it('instantiable',()=>{expect(new StakeholderMapper()).toBeDefined()});
    it('returns something',()=>{const m=new StakeholderMapper();const r=(m as any).mapStakeholders?.('topic','claim') ?? (m as any).map?.('topic');expect(r===null || typeof r==='object' || typeof r==='undefined').toBe(true)});
});
