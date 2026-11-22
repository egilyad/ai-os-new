/** Phase 108 — pluggable thought/action parsers. */
import type { Phase } from './helpers';
import { ActionParserService } from '../services/tool-loop/action-parser-service';

export const registerPhase108: Phase = ({ register }) => {
    register('actionParserService', () => new ActionParserService());
};
