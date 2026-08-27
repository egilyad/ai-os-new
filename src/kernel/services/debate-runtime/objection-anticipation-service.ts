import type { IObjectionAnticipationService, ObjectionSlot } from '../../contracts/debate-objection-anticipation';
export class ObjectionAnticipationService implements IObjectionAnticipationService {
    anticipate(claim: string): ObjectionSlot | null {
        if (!claim||claim.length<20) return null;
        return { objection: `Opponent might object that ${claim.slice(0,50)} overstates`, prebuttal: `However, evidence shows ${claim.slice(0,30)} holds under conditions` };
    }
}
