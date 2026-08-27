import type { IFactCheckingService, FactCheckResult } from '../../contracts/debate-fact-checking';
export class FactCheckingServiceSimple implements IFactCheckingService {
    check(claim: string): FactCheckResult {
        if (/\d+%/.test(claim)) return { claim: claim.slice(0,60), verdict: 'uncertain' };
        if (/always|never/.test(claim)) return { claim: claim.slice(0,60), verdict: 'false' };
        return { claim: claim.slice(0,60), verdict: 'true' };
    }
}
