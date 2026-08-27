import { describe, it, expect } from 'vitest';
import { StrategistService } from './strategist-service';
describe('StrategistService',()=>{
    const s=new StrategistService();
    it('probe early',()=>{expect(s.advise('topic',1)).toContain('Probe')});
    it('attack mid',()=>{expect(s.advise('topic',3)).toContain('Attack')});
    it('synthesize late',()=>{expect(s.advise('topic',5)).toContain('Synthesize')});
});
