import type { ICounterfactualService, CounterfactualScenario } from '../../contracts/debate-counterfactual';

export class CounterfactualService implements ICounterfactualService {
    generate(topic: string, opponentClaim: string): CounterfactualScenario | null {
        if (!opponentClaim || opponentClaim.length < 20) return null;
        return {
            assumption: opponentClaim.slice(0, 80),
            alteredWorld: `What if ${opponentClaim.slice(0, 60)} were false?`,
            implication: `Then the position on "${topic.slice(0, 60)}" would need re-evaluation, but core thesis may still hold via alternative evidence.`,
        };
    }
}
