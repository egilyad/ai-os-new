/**
 * Phase 13 — Lenses.
 *
 * Registers the Lens Engine (composable cognitive perspectives).
 * Depends on phase 8 (unified role registry) for role-based suggestions.
 */
import type { Phase } from './helpers';
import { LensEngineService } from '../services/lens-engine/lens-engine-service';

export const registerPhase13: Phase = ({ register }) => {
    register('lensEngine', (_c) => new LensEngineService());
};
