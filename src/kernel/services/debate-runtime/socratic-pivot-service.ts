import type { ISocraticPivotService, PivotQuestion } from '../../contracts/debate-socratic-pivot';
export class SocraticPivotService implements ISocraticPivotService {
    pivot(claim: string): PivotQuestion | null {
        if (!claim||claim.length<15) return null;
        return { question: `What hidden assumption underlies "${claim.slice(0,50)}"?` };
    }
}
