/**
 * Phase 8 — Roles & Consortia.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import type { IDatabaseService, IEventBus } from '../types/interfaces';
import type { IAdapterRegistry } from '../contracts/provider-adapter';
import { UnifiedRoleRegistry } from '../services/unified-role-service';
import { RoleTeamService, type RoleTeamServiceDeps } from '../services/role-team-service';

export const registerPhase8: Phase = ({ register }) => {
    register('unifiedRoleRegistry', (_c) => new UnifiedRoleRegistry());
    register('roleTeamService', (c) => {
        const deps: RoleTeamServiceDeps = {
            eventBus: c.get<IEventBus>('eventBus'),
            database: c.get<IDatabaseService>('database'),
            keyService: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getKeys: () => (c.get<any>('keyService') as { getKeys: () => any[] }).getKeys(),
            },
            adapterRegistry: {
                getAdapter: (provider: string) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    c.get<IAdapterRegistry>('adapterRegistry').getAdapter(provider) as any,
            },
        };
        return new RoleTeamService(deps);
    });
};
