/** Phase 101 — model-class routing (E4). */
import type { Phase } from './helpers';
import { ModelClassRouterService } from '../services/routing/model-class-router-service';

export const registerPhase101: Phase = ({ register }) => {
    register('modelClassRouterService', () => new ModelClassRouterService());
};
