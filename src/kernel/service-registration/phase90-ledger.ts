/** Phase 90 — mission ledger (Task/Fact + progress reflection). */
import type { Phase } from './helpers';
import type { IDatabaseService } from '../types/interfaces';
import { MissionLedgerService } from '../services/orchestrator/mission-ledger-service';
import { RunHistoryService } from '../services/orchestrator/run-history-service';
import type { IRunHistoryService } from '../contracts/run-history';
import type { ProjectGraphService } from '../services/project-graph/project-graph-service';
import { RunProvenanceLinkService } from '../services/project-graph/run-provenance-link-service';

export const registerPhase90: Phase = ({ register }) => {
    register('missionLedgerService', () => new MissionLedgerService());
    register(
        'runHistoryService',
        (c) => new RunHistoryService({ database: c.get<IDatabaseService>('database') }),
    );
    register(
        'runProvenanceLinkService',
        (c) =>
            new RunProvenanceLinkService({
                history: c.get<IRunHistoryService>('runHistoryService'),
                graph: c.get<ProjectGraphService>('projectGraphService'),
            }),
    );
};
