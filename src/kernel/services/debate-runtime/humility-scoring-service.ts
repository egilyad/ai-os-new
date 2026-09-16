import type { IHumilityScoringService, HumilityScore } from '../../contracts/debate-humility-scoring';

/**
 * HumilityScoringService — P1
 * Detects hedges ("maybe", "perhaps", "I might be wrong") vs overconfident absolutism.
 */
export class HumilityScoringService implements IHumilityScoringService {
    private hedgePattern = /\b(maybe|perhaps|possibly|might|could|seems|appears|uncertain|i think|i believe|in my view|potentially|arguably)\b/i;
    private overPattern = /\b(always|never|certainly|definitely|undoubtedly|clearly|obviously|everyone knows|no doubt|100%)\b/i;

    score(text: string): HumilityScore {
        const hasHedge = this.hedgePattern.test(text);
        const hasOver = this.overPattern.test(text);
        const hedgeCount = (text.match(new RegExp(this.hedgePattern, 'gi')) || []).length;
        const overCount = (text.match(new RegExp(this.overPattern, 'gi')) || []).length;
        const humility = Math.min(1, hedgeCount * 0.3 + (hasHedge ? 0.2 : 0));
        const overconfidence = Math.min(1, overCount * 0.4 + (hasOver ? 0.2 : 0));
        return { text: text.slice(0, 200), humility, overconfidence, hasHedge };
    }

    isHumble(text: string): boolean {
        const s = this.score(text);
        return s.humility > s.overconfidence && s.humility > 0.2;
    }
}
