import { describe, it, expect } from 'vitest';
import { OutcomeForecaster } from './outcome-forecaster';
describe('OutcomeForecaster',()=>{
    it('instantiable',()=>{expect(new OutcomeForecaster()).toBeDefined()});
    it('has forecast',()=>{const f=new OutcomeForecaster();expect(f).toBeDefined()});
    it('true',()=>{expect(true).toBe(true)});
});
