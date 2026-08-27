import { describe, it, expect } from 'vitest';
import { AllianceService } from './alliance-service';
describe('AllianceService',()=>{
    const s=new AllianceService();
    it('form',()=>{expect(s.form(['a','b'],'topic about climate')?.members.length).toBe(2)});
    it('null single',()=>{expect(s.form(['a'],'topic')).toBeNull()});
    it('strength',()=>{expect(s.form(['a','b'],'long topic about climate policy')!.strength).toBeGreaterThan(0)});
});
