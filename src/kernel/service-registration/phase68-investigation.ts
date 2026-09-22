/**
 * Phase 68 — Investigation bridge (B1: первый живой junction ядра).
 *
 * Детектор (событие) → runDiagnostic → propose(hypothesis) + startRun.
 * Только propose+startRun: исполнений и мутаций мост НЕ делает.
 * Страховка: enabled-флаг, дневной кап, дедуп по источнику (см. сервис).
 *
 * Additive — остальные фазы не тронуты.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IDatabaseService } from '../types/interfaces';
import type { IHypothesisService } from '../contracts/hypothesis';
import type { IDiagnosticService } from '../contracts/diagnostic-service';
import type { ResearchRunService } from '../services/research-run-service';
import { InvestigationBridgeService } from '../services/investigation-bridge-service';

export const registerPhase68: Phase = ({ register }, ctx) => {
    register('investigationBridge', (c: IContainer) => {
        const svc = new InvestigationBridgeService({
            eventBus: c.get<IEventBus>('eventBus'),
            hypothesis: c.get<IHypothesisService>('hypothesisService'),
            runs: c.get<ResearchRunService>('researchRunService'),
            diagnostic: c.get<IDiagnosticService>('diagnosticService'),
            database: c.get<IDatabaseService>('database'),
        });
        void svc.start();
        ctx.registerWithLifecycle('investigationBridge', svc);
        return svc;
    });
};
