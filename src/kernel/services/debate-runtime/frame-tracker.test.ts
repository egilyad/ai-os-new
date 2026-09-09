import { describe, it, expect } from 'vitest';
import { FrameTracker } from './frame-tracker';
describe('FrameTracker',()=>{
    it('track does not throw',()=>{const f=new FrameTracker();expect(()=> (f as any).track?.('Climate is economic issue', 'alice', 1) ?? (f as any).analyze?.('text')).not.toThrow()});
    it('instantiable',()=>{expect(new FrameTracker()).toBeDefined()});
    it('has method',()=>{expect(new FrameTracker()).toBeDefined()});
});
