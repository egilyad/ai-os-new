import type { IRedundancyService, RedundancyReport } from '../../contracts/debate-redundancy';
export class RedundancyService implements IRedundancyService {
    check(current: string, previous: string[]): RedundancyReport {
        const tok = (s:string)=>new Set(s.toLowerCase().split(/\W+/).filter(Boolean));
        const cur = tok(current);
        let maxSim=0, priorId: string|undefined;
        for (const p of previous) {
            const pt = tok(p);
            const inter = [...cur].filter(w=>pt.has(w)).length;
            const union = new Set([...cur,...pt]).size;
            const sim = union?inter/union:0;
            if (sim>maxSim) { maxSim=sim; priorId=p.slice(0,20); }
        }
        return { isRedundant: maxSim>0.6, similarity: maxSim, priorId };
    }
}
