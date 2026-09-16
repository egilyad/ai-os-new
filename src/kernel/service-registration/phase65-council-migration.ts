/**
 * Phase 65 — Council Migration Gate (D4.5b, single session, без bulk).
 *
 * Registers councilMigrationService (gate+checksum+rollback, no Dexie destructive, no SSOT switch).
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DatabaseService } from '../services/database-service';
import type { CouncilRepository } from '../dal/council-repository';
import type { StorageLayer } from '../contracts/storage/storage-layer';
import { CouncilMigrationService } from '../services/council/council-migration-service';

export const registerPhase65: Phase = ({ register }) => {
    register('councilMigrationService', (c: IContainer) => {
        const storageLayer = c.has('storageLayer') ? c.get<StorageLayer>('storageLayer') : undefined;
        return new CouncilMigrationService({
            councilRepo: c.get<CouncilRepository>('councilRepository'),
            database: c.get<DatabaseService>('database'),
            debateStore: storageLayer?.debates,
        });
    });
};
