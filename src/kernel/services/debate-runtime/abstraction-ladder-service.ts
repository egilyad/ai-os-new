import type { IAbstractionLadderService, LadderStep } from '../../contracts/debate-abstraction-ladder';
export class AbstractionLadderService implements IAbstractionLadderService {
    ladder(text: string): LadderStep[] {
        const sents=text.split(/[.!?]+/).filter(Boolean);
        return sents.slice(0,3).map((s,i)=>({ level: i%2===0?'concrete':'abstract' as const, text:s.trim().slice(0,80)}));
    }
}
