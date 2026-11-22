/** Phase 91 — typed HITL interrupts with Zod-validated resume. */
import type { Phase } from './helpers';
import { HitlInterruptService } from '../services/hitl/hitl-interrupt-service';

export const registerPhase91: Phase = ({ register }) => {
    register('hitlInterruptService', () => new HitlInterruptService());
};
