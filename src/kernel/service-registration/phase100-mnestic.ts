/** Phase 100 — mnestic weighted retrieval + salience reflection. */
import type { Phase } from './helpers';
import { MnesticService } from '../services/memory/mnestic-service';

export const registerPhase100: Phase = ({ register }) => {
    register('mnesticService', () => new MnesticService());
};
