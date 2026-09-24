import { describe, it, expect } from 'vitest';
import { StakeholderMapper } from './stakeholder-mapper';
describe('StakeholderMapper',()=>{
    it('map does not throw',()=>{const m=new StakeholderMapper();expect(()=> m.analyzeTopic('Climate policy')).not.toThrow()});
    it('instantiable',()=>{expect(new StakeholderMapper()).toBeDefined()});
    it('returns something',()=>{const m=new StakeholderMapper();const r=m.analyzeTopic('solar energy topic');expect(Array.isArray(r)).toBe(true)});
});
