/**
 * Phase 77 — Integration Service (AGEMS port, Phase 10).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { IntegrationService } from '../services/integration-service';

export const registerPhase77: Phase = ({ register }) => {
    register('integrationService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new IntegrationService({
            telegramChats: db.telegramChats,
            telegramMessages: db.telegramMessages,
            n8nWorkflows: db.n8nWorkflows,
            mcpServers: db.mcpServers,
        });
    });
};
