/**
 * Phase 17 — Knowledge Generator.
 *
 * Registers the Knowledge Generator (autonomous research cycle) service.
 * Depends on phase 0 (dal + eventBus), phase 8 (unifiedRoleRegistry),
 * phase 13 (lensEngine), phase 14 (crystalVault).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal';
import type { ILensEngineService } from '../contracts/lens-engine';
import type { ICrystalVaultService } from '../contracts/knowledge-crystal';
import type { IUnifiedRoleRegistry } from '../contracts/unified-role';
import type { Role } from '../types/role-types';
import { KnowledgeGeneratorService } from '../services/knowledge-generator/knowledge-generator-service';

export const registerPhase17: Phase = ({ register }) => {
    register(
        'knowledgeGenerator',
        (c: IContainer) =>
            new KnowledgeGeneratorService({
                repository: c.get<DataAccessLayer>('dal').generator,
                eventBus: c.get<IEventBus>('eventBus'),
                lensEngine: c.get<ILensEngineService>('lensEngine'),
                crystalVault: c.get<ICrystalVaultService>('crystalVault'),
                roles: (roleId: string) =>
                    loadRole(
                        c.get<DataAccessLayer>('dal'),
                        c.get<IUnifiedRoleRegistry>('unifiedRoleRegistry'),
                        roleId,
                    ),
            }),
    );
};

async function loadRole(
    dal: DataAccessLayer,
    registry: IUnifiedRoleRegistry,
    roleId: string,
): Promise<Role | undefined> {
    try {
        const stored = await dal.roles.get(roleId);
        if (stored) return stored;
    } catch {
        // fall through to the role registry
    }
    const entry = registry.getRole(roleId);
    if (!entry) return undefined;
    return {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        systemPrompt: entry.systemPrompt,
        capabilities: entry.tools,
        permissions: entry.permissions,
        metadata: {
            category: 'analytical',
            created: Date.now(),
            updated: Date.now(),
            tags: entry.metadata.tags,
        },
    };
}
