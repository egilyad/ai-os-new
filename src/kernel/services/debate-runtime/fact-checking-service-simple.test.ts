import { describe, it, expect } from 'vitest';
import { FactCheckingServiceSimple } from './fact-checking-service';
describe('FactCheckingServiceSimple',()=>{
    const s=new FactCheckingServiceSimple();
    it('uncertain on percent',()=>{expect(s.check('42% growth').verdict).toBe('uncertain')});
    it('false on always',()=>{expect(s.check('always true').verdict).toBe('false')});
    it('true otherwise',()=>{expect(s.check('the sky is blue').verdict).toBe('true')});
});
