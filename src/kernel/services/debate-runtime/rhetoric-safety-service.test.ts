import { describe, it, expect } from 'vitest';
import { RhetoricSafetyService } from './rhetoric-safety-service';
describe('RhetoricSafetyService',()=>{
    const s=new RhetoricSafetyService();
    it('flags ad hominem',()=>{expect(s.check('you are stupid idiot').flagged).toBe(true)});
    it('not flag clean',()=>{expect(s.check('We disagree on policy with data').flagged).toBe(false)});
    it('has reason',()=>{expect(s.check('you are stupid').reason).toBeDefined()});
});
