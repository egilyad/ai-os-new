/** Phase 109 — history processing pipeline. */
import type { Phase } from './helpers';
import { HistoryProcessorService } from '../services/tool-loop/history-processor-service';

export const registerPhase109: Phase = ({ register }) => {
    register('historyProcessorService', () => new HistoryProcessorService());
};
