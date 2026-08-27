import type { IEvidenceRevelationService, RevealStage } from '../../contracts/debate-evidence-revelation';
export class EvidenceRevelationService implements IEvidenceRevelationService {
    stage(round: number, all: string[]): RevealStage | null {
        if (round<1||all.length===0) return null;
        const idx=Math.min(round-1, all.length-1);
        return { round, evidence: all[idx].slice(0,120) };
    }
}
