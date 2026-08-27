import type { IRhetoricSafetyService, SafetyFlag } from '../../contracts/debate-rhetoric-safety';
export class RhetoricSafetyService implements IRhetoricSafetyService {
    check(t: string): SafetyFlag {
        if (/\b(you are stupid|idiot|moron|ad hominem|hate you)\b/i.test(t)) return { flagged:true, reason:'ad hominem' };
        if (/(kill|destroy).*you/i.test(t)) return { flagged:true, reason:'inflammatory' };
        return { flagged:false };
    }
}
