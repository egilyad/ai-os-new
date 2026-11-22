/** Phase 90 — mission ledger (Task/Fact + progress reflection). */
import type { Phase } from './helpers';
import type { IDatabaseService } from '../types/interfaces';
import { MissionLedgerService } from '../services/orchestrator/mission-ledger-service';
import { RunHistoryService } from '../services/orchestrator/run-history-service';

export const registerPhase90: Phase = ({ register }) => {
    register('missionLedgerService', () => new MissionLedgerService());
    register(
        'runHistoryService',
        (c) => new RunHistoryService({ database: c.get<IDatabaseService>('database') }),
    );
};
