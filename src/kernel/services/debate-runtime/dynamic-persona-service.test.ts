import { describe, it, expect } from 'vitest';
import { DynamicPersonaService } from './dynamic-persona-service';
describe('DynamicPersonaService',()=>{
    const s=new DynamicPersonaService();
    it('scientist for climate',()=>{expect(s.select('climate change energy').variant).toBe('scientist')});
    it('economist',()=>{expect(s.select('economy market').variant).toBe('economist')});
    it('default',()=>{expect(s.select('random topic').variant).toBe('generalist')});
});
