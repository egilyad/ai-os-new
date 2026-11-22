/** Phase 93 — review-gated retry loop. */
import type { Phase } from './helpers';
import { ReviewRetryService } from '../services/artifact-verifier/review-retry-service';

export const registerPhase93: Phase = ({ register }) => {
    register('reviewRetryService', () => new ReviewRetryService());
};
