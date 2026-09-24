import { describe, it, expect } from 'vitest';
import { BiasProfiler } from './bias-profiler';
describe('BiasProfiler',()=>{
    it('profile does not throw',()=>{
        const b=new BiasProfiler();
        expect(()=> b.analyzeArgument('alice', 1, 'We always win, never lose, everyone knows')).not.toThrow();
    });
    it('instantiable',()=>{expect(new BiasProfiler()).toBeDefined()});
    it('returns something',()=>{
        const b=new BiasProfiler();
        b.analyzeArgument('alice', 1, 'We always win, never lose, everyone knows this is the best approach ever');
        expect(b.getProfile('alice', 1)).toBeDefined();
        b.clearSession();
        expect(b.getProfile('alice', 1)).toBeUndefined();
    });
});
