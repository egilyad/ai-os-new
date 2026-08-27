import { describe, it, expect } from 'vitest';
import { PredictionMarketService } from './prediction-market-service';
describe('PredictionMarketService',()=>{
    const s=new PredictionMarketService();
    it('predict',()=>{expect(s.predict(['a','b'],'topic').length).toBe(2)});
    it('confidence',()=>{expect(s.predict(['a'],'t')[0].confidence).toBeGreaterThan(0)});
    it('not throw',()=>{expect(()=>s.predict([],'t')).not.toThrow()});
});
