/**
 * Phase 68 — Agent Management System (AGEMS port, Phase 0).
 *
 * Full agent lifecycle: types, status, config, hierarchy, skills, tools,
 * responsibilities, metrics, memory, executions, config revisions, budgets.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService, IEventBus } from '../types/interfaces';
import { AgentManagementService } from '../services/agent-management-service';

export const registerPhase68: Phase = ({ register }) => {
    register('agentManagementService', (c: IContainer) => {
        return new AgentManagementService(
            c.get<IDatabaseService>('database'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
