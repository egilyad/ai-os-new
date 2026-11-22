/** Phase 98 — durable resume planning for failed graph runs. */
import type { Phase } from './helpers';
import { DurableRunService } from '../services/graph/durable-run-service';

export const registerPhase98: Phase = ({ register }) => {
    register('durableRunService', () => new DurableRunService());
};
