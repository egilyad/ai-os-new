import type { IJudgeDeliberationService, DeliberationResult } from '../../contracts/debate-judge-deliberation';
export class JudgeDeliberationService implements IJudgeDeliberationService {
    deliberate(scores: number[]): DeliberationResult {
        const avg=scores.reduce((a,b)=>a+b,0)/Math.max(1,scores.length);
        return { consensus: `Consensus score ${avg.toFixed(2)}`, score: avg };
    }
}
