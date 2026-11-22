/** Phase 104 — execution replay and hand-off validation. */
import type { Phase } from './helpers';
import { ExecutionReplayService } from '../services/orchestrator/execution-replay-service';

export const registerPhase104: Phase = ({ register }) => {
    register('executionReplayService', () => new ExecutionReplayService());
};
