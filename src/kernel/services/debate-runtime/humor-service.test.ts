import { describe, it, expect } from 'vitest';
import { HumorService } from './humor-service';
describe('HumorService',()=>{
    const s=new HumorService();
    it('inject',()=>{expect(s.inject('climate change')?.type).toBe('wit')});
    it('null short',()=>{expect(s.inject('hi')).toBeNull()});
    it('has text',()=>{expect(s.inject('topic')!.text.length).toBeGreaterThan(0)});
});
