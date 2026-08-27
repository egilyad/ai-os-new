import { describe, it, expect } from 'vitest';
import { EmpathyService } from './empathy-service';
describe('EmpathyService',()=>{
    const s=new EmpathyService();
    it('mirror generates',()=>{expect(s.mirror('I care about climate').hasEmpathy).toBe(true)});
    it('hasEmpathy detects',()=>{expect(s.hasEmpathy('I understand your view')).toBe(true);expect(s.hasEmpathy('You are wrong')).toBe(false)});
    it('empty returns false',()=>{expect(s.mirror('').hasEmpathy).toBe(false)});
});
