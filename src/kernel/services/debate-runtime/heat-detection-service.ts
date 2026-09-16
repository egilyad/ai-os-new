import type { IHeatDetectionService, HeatLevel } from '../../contracts/debate-heat';
export class HeatDetectionService implements IHeatDetectionService {
    detect(text: string): HeatLevel {
        const exclaims = (text.match(/!/g)||[]).length;
        const caps = (text.match(/\b[A-Z]{2,}\b/g)||[]).length;
        const strong = (text.match(/\b(absolutely|never|always|disaster|catastrophe|urgent|destroy)\b/gi)||[]).length;
        const score = Math.min(1, exclaims*0.2 + caps*0.15 + strong*0.2);
        return { level: score, label: score>0.6?'high':score>0.3?'medium':'low' };
    }
    detectHistory(texts: string[]): HeatLevel {
        if (texts.length===0) return { level:0, label:'low' };
        const avg = texts.map(t=>this.detect(t).level).reduce((a,b)=>a+b,0)/texts.length;
        return { level:avg, label: avg>0.6?'high':avg>0.3?'medium':'low' };
    }
}
