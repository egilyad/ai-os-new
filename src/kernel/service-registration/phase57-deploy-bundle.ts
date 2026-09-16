/**
 * Phase 57 — Deploy Bundle (GAP G4, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration — uses keyValue):
 *   - deployBundleService (bundle zip manifest stub + env manifest + start script)
 *
 * Real zip/filesystem/cloud push = BLOCKED-RUNTIME.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IDeployService } from '../contracts/deploy';
import type { DatabaseService } from '../services/database-service';
import { DeployBundleService } from '../services/deploy/deploy-bundle-service';

export const registerPhase57: Phase = ({ register }) => {
    register('deployBundleService', (c: IContainer) => {
        return new DeployBundleService({
            deployService: c.get<IDeployService>('deployService'),
            database: c.get<DatabaseService>('database'),
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
