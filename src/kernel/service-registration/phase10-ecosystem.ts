/**
 * Phase 10 — Ecosystem Engine.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import { EcosystemEngine } from '../services/ecosystem-engine';
import { BucketStorageAdapter } from '../storage-adapter-instance';

export const registerPhase10: Phase = ({ register }) => {
    register('ecosystemEngine', (_c) => new EcosystemEngine({ storage: BucketStorageAdapter }));
};
