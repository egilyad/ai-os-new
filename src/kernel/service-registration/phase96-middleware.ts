/** Phase 96 — composable agent middleware lifecycle. */
import type { Phase } from './helpers';
import { MiddlewareService } from '../services/middleware/middleware-service';

export const registerPhase96: Phase = ({ register }) => {
    register('middlewareService', () => new MiddlewareService());
};
