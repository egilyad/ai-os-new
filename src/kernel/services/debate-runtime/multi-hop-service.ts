import type { IMultiHopService, MultiHopCheck } from '../../contracts/debate-multi-hop';
export class MultiHopService implements IMultiHopService {
    check(text: string): MultiHopCheck {
        const hops = (text.match(/\b(therefore|because|since|so|then|hence|thus|consequently)\b/gi)||[]).length + 1;
        return { hops, isMultiHop: hops>=3 };
    }
}
