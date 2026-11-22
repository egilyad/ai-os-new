/** Phase 89 — composable termination conditions (AutoGen-style). */
import type { Phase } from './helpers';
import { TerminationService } from '../services/termination/termination-service';

export const registerPhase89: Phase = ({ register }) => {
    register('terminationService', () => new TerminationService());
};
