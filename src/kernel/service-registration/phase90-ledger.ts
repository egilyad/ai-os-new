/** Phase 90 — mission ledger (Task/Fact + progress reflection). */
import type { Phase } from './helpers';
import { MissionLedgerService } from '../services/orchestrator/mission-ledger-service';

export const registerPhase90: Phase = ({ register }) => {
    register('missionLedgerService', () => new MissionLedgerService());
};
