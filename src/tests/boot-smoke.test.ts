import { describe, it } from 'vitest';
import 'fake-indexeddb/auto';

import { defaultContainer } from '../kernel/container';
import { eventBus as coreEventBus } from '../kernel/events/event-bus';
import { db as coreDatabase } from '../kernel/services/database-service';
import { DataAccessLayerImpl } from '../kernel/dal/data-access-layer';
import { SecurityService } from '../kernel/security';
import { LocalStorageAdapter } from '../kernel/services/storage/local-storage-adapter';
import { initSchedulerService } from '../kernel/services/scheduler-service';
import { createDexieStorage } from '../kernel/services/storage/dexie-storage';
import { registerServices } from '../kernel/service-registration';

describe('boot smoke (DI registration)', () => {
    it('resolves agentService/orchestrator/roleService', () => {
        const container = defaultContainer;
        container.register('runtime', {});
        container.register('database', coreDatabase);
        coreDatabase.init();
        container.register('dal', new DataAccessLayerImpl(coreDatabase));
        container.register('eventBus', coreEventBus);
        container.register('securityService', new SecurityService());
        container.register('BucketStorageAdapter', new LocalStorageAdapter());
        const scheduler = initSchedulerService(coreDatabase, coreEventBus);
        container.register('schedulerService', scheduler);
        const storageLayer = createDexieStorage();
        container.register('storageLayer', storageLayer);

        registerServices(container, coreEventBus, () => {});

        for (const name of [
            'agentService',
            'orchestrator',
            'roleService',
            'snapshotService',
            'timeMachineService',
            'advisorService',
        ]) {
            try {
                const svc = container.get<unknown>(name);
                console.log(`SMOKE OK ${name} -> ${typeof svc}`);
            } catch (e) {
                console.log(`SMOKE FAIL ${name}: ${e instanceof Error ? e.message : String(e)}`);
                throw e;
            }
        }
    });
});
