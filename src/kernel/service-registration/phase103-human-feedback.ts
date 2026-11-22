/** Phase 103 — human feedback → prompt improvement deltas. */
import type { Phase } from './helpers';
import { HumanFeedbackService } from '../services/training/human-feedback-service';

export const registerPhase103: Phase = ({ register }) => {
    register('humanFeedbackService', () => new HumanFeedbackService());
};
