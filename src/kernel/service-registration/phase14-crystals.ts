/**
 * Phase 14 — Crystal Vault.
 *
 * Registers the Crystal Vault service (versioned knowledge units) and the
 * CrystalDebateBridge (distills crystals from debate verdicts).
 * Depends on phase 0 (dal + eventBus), phase 3 (debates) and phase 13 (lenses).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal';
import { CrystalVaultService } from '../services/crystal-vault/crystal-vault-service';
import { CrystalDebateBridge } from '../services/crystal-vault/crystal-debate-bridge';
import type { ICrystalVaultService } from '../contracts/knowledge-crystal';

export const registerPhase14: Phase = ({ register }) => {
    register(
        'crystalVault',
        (c: IContainer) =>
            new CrystalVaultService({
                repository: c.get<DataAccessLayer>('dal').crystal,
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'crystalDebateBridge',
        (c: IContainer) =>
            new CrystalDebateBridge({
                eventBus: c.get<IEventBus>('eventBus'),
                crystalVault: c.get<ICrystalVaultService>('crystalVault'),
            }),
    );
};
