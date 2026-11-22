/** Phase 107 — mid-reply steering hints. */
import type { Phase } from './helpers';
import { SteeringService } from '../services/middleware/steering-service';

export const registerPhase107: Phase = ({ register }) => {
    register('steeringService', () => new SteeringService());
};
