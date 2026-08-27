import { describe, it, expect } from 'vitest';
import { RedundancyService } from './redundancy-service';
describe('RedundancyService',()=>{
    const s=new RedundancyService();
    it('detects redundant',()=>{expect(s.check('solar energy is great and clean', ['solar energy is great and clean']).isRedundant).toBe(true)});
    it('not redundant novel',()=>{expect(s.check('nuclear quantum physics', ['solar energy clean']).isRedundant).toBe(false)});
    it('similarity range',()=>{expect(s.check('hello world',['hello world']).similarity).toBe(1)});
});
