import type { IEnthymemeService, EnthymemeGap } from '../../contracts/debate-enthymeme';
export class EnthymemeService implements IEnthymemeService {
    findGaps(text: string): EnthymemeGap[] {
        const gaps: EnthymemeGap[] = [];
        if (/we should.*because/i.test(text) && !/evidence|study|data/i.test(text)) gaps.push({ premise: text.slice(0,80), hidden: 'Missing evidence for causal premise' });
        if (/\b(all|every|always)\b/i.test(text)) gaps.push({ premise: text.slice(0,80), hidden: 'Universal quantifier hides counterexample' });
        return gaps;
    }
}
