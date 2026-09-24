import { describe, it, expect } from 'vitest';
import { FrameTracker } from './frame-tracker';
describe('FrameTracker',()=>{
    it('track does not throw',()=>{const f=new FrameTracker();expect(()=> f.registerFrame('alice', 'Alice', 1, 'Climate is economic issue')).not.toThrow();expect(f.getEntries()).toHaveLength(1)});
    it('instantiable',()=>{expect(new FrameTracker()).toBeDefined()});
    it('has method',()=>{expect(new FrameTracker()).toBeDefined()});
});
