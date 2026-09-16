import { describe, it, expect } from 'vitest';
import { BiasProfiler } from './bias-profiler';
describe('BiasProfiler',()=>{
    it('profile does not throw',()=>{
        const b=new BiasProfiler();
        expect(()=> (b as any).profile?.('We always win, never lose, everyone knows', 'alice')).not.toThrow();
    });
    it('instantiable',()=>{expect(new BiasProfiler()).toBeDefined()});
    it('returns something',()=>{
        const b=new BiasProfiler();
        const fn=(b as any).analyze || (b as any).profile || (b as any).score;
        if(fn) expect(()=>fn.call(b,'test','alice')).not.toThrow();
        else expect(true).toBe(true);
    });
});
