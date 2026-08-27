import type { IRoleReversalService, ReversalPrompt } from '../../contracts/debate-role-reversal';
export class RoleReversalService implements IRoleReversalService {
    flip(p: string): ReversalPrompt { return { flipped: `Opposite perspective: ${p.slice(0,80)} — argue against your own prior stance.` }; }
}
