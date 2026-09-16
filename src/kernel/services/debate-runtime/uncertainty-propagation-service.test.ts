import { describe, it, expect } from 'vitest';
import { UncertaintyPropagationService } from './uncertainty-propagation-service';
describe('UncertaintyPropagationService',()=>{
    const s=new UncertaintyPropagationService();
    it('propagate low dominates',()=>{expect(s.propagate([{claim:'a',confidence:'high'},{claim:'b',confidence:'low'}])[0].confidence).toBe('low')});
    it('medium',()=>{expect(s.propagate([{claim:'a',confidence:'high'},{claim:'b',confidence:'medium'}])[0].confidence).toBe('medium')});
    it('high stays high',()=>{expect(s.propagate([{claim:'a',confidence:'high'}])[0].confidence).toBe('high')});
});
