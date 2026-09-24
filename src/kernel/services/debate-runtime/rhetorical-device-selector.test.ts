import { describe, it, expect } from 'vitest';
import { RhetoricalDeviceSelector } from './rhetorical-device-selector';
describe('RhetoricalDeviceSelector',()=>{
    it('select does not throw',()=>{const r=new RhetoricalDeviceSelector();expect(()=> r.getDevicePrompt('pro', 1, 'English')).not.toThrow()});
    it('instantiable',()=>{expect(new RhetoricalDeviceSelector()).toBeDefined()});
    it('returns',()=>{const r=new RhetoricalDeviceSelector();expect(r).toBeDefined()});
});
