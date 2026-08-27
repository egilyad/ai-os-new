import { describe, it, expect } from 'vitest';
import { FogOfWarService } from './fog-of-war-service';
describe('FogOfWarService',()=>{
    const s=new FogOfWarService();
    it('filter',()=>{expect(s.filter('alice',['alice','bob','carol']).visibleIds).not.toContain('alice')});
    it('length',()=>{expect(s.filter('a',['a','b','c','d']).visibleIds.length).toBeLessThanOrEqual(3)});
    it('not throw',()=>{expect(()=>s.filter('x',[])).not.toThrow()});
});
