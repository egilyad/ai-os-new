import type { IPivotService, PivotSignal } from '../../contracts/debate-pivot';

export class PivotService implements IPivotService {
    evaluate(agentId: string, recentScores: number[], currentRound: number): PivotSignal {
        if (recentScores.length < 2) return { shouldPivot: false, reason: 'insufficient data', suggestedAngle: '' };
        const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const trendingDown = recentScores[recentScores.length - 1] < recentScores[0];
        if (avg < 0.5 && trendingDown && currentRound > 2) {
            return { shouldPivot: true, reason: 'scores declining', suggestedAngle: 'Reframe with new evidence or attacker angle' };
        }
        return { shouldPivot: false, reason: 'stable', suggestedAngle: '' };
    }
}
