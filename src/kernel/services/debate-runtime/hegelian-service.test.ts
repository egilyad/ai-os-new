import { describe, it, expect } from 'vitest';
import { HegelianService } from './hegelian-service';
describe('HegelianService',()=>{
    const s=new HegelianService();
    it('synthesize',()=>{expect(s.synthesize('Thesis about solar','Antithesis about nuclear')?.synthesis).toContain('Synthesis')});
    it('null empty',()=>{expect(s.synthesize('','')).toBeNull()});
    it('has fields',()=>{const r=s.synthesize('t','a')!;expect(r.thesis).toBeDefined();expect(r.antithesis).toBeDefined()});
});
