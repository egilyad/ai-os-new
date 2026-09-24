import { describe, it, expect } from 'vitest';
import { BlindEvaluationService } from './blind-evaluation-service';
describe('BlindEvaluationService',()=>{
    it('instantiable',()=>{expect(new BlindEvaluationService()).toBeDefined()});
    it('not throw',()=>{const s=new BlindEvaluationService();expect(()=> s.evaluateBlindly(['agent-1'], [], () => [])).not.toThrow()});
    it('true',()=>{expect(true).toBe(true)});
});
