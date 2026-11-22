/**
 * Review-gated retry loop (SWE-agent ScoreRetryLoop inspiration).
 *
 * Runs `produce`, asks `review` to score it, and retries with the previous
 * feedback while the score is below threshold. Keeps the best-scoring result
 * when the budget is exhausted — never silently returns a rejected artifact.
 */
import type {
    IReviewRetryService,
    ReviewRetryResult,
    ReviewScore,
} from '../../contracts/review-retry';

export class ReviewRetryService implements IReviewRetryService {
    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    async run<T>(opts: {
        threshold: number;
        maxAttempts: number;
        produce(feedback: string | undefined, attempt: number): Promise<T>;
        review(value: T, attempt: number): Promise<ReviewScore>;
    }): Promise<ReviewRetryResult<T>> {
        const attempts = Math.max(1, opts.maxAttempts);
        let feedback: string | undefined;
        let lastValue: T | undefined;
        let lastScore: ReviewScore | undefined;
        let bestValue: T | undefined;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < attempts; i++) {
            lastValue = await opts.produce(feedback, i);
            lastScore = await opts.review(lastValue, i);
            if (lastScore.overall > bestScore) {
                bestScore = lastScore.overall;
                bestValue = lastValue;
            }
            if (lastScore.overall >= opts.threshold) {
                return { value: lastValue, score: lastScore, attempts: i + 1, accepted: true };
            }
            feedback = lastScore.feedback ?? `Score ${lastScore.overall} below ${opts.threshold}`;
        }

        return {
            value: bestValue as T,
            score: lastScore as ReviewScore,
            attempts,
            accepted: false,
        };
    }
}
