/**
 * Phase 74 — Module Settings Service (AGEMS port, Phase 7.2).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { ModuleSettingsService } from '../services/module-settings-service';

export const registerPhase74: Phase = ({ register }) => {
    register('moduleSettingsService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new ModuleSettingsService({ keyValue: db });
    });
};
