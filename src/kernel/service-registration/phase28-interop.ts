/**
 * Phase 28 — Interop / federation / coordination (Roadmap Phase A).
 *
 * Registers:
 *   - `interopRepository` (DAL over 6 v28 tables)
 *   - `a2aService` (discovery/advertisement/negotiation/handoff, loopback)
 *   - `gatewayService` (multi-protocol ingress + translation to EventBus)
 *   - `federationService` (peers + trust-gated dispatch, loopback)
 *   - `coordinationService` (Manifest 2.0, handoff, market, routing,
 *     contracts; dynamic-topology/recursive delegates wired to Crew/Forge)
 *
 * Additive — MCPService / WorkforceFederation / router untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ICrewService, IAgentForgeService } from '../contracts/crew';
import { InteropRepository } from '../dal/interop-repository';
import { A2AService } from '../services/interop/a2a-service';
import { GatewayService } from '../services/interop/gateway-service';
import { FederationService } from '../services/interop/federation-service';
import { CoordinationService } from '../services/interop/coordination-service';

export const registerPhase28: Phase = ({ register }) => {
    register('interopRepository', (c: IContainer) => {
        return new InteropRepository(c.get<DatabaseService>('database'));
    });

    register('a2aService', (c: IContainer) => {
        return new A2AService(
            c.get<InteropRepository>('interopRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('gatewayService', (c: IContainer) => {
        return new GatewayService(
            c.get<InteropRepository>('interopRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('federationService', (c: IContainer) => {
        return new FederationService(
            c.get<InteropRepository>('interopRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('coordinationService', (c: IContainer) => {
        const crew = c.get<ICrewService>('crewService');
        const forge = c.get<IAgentForgeService>('agentForgeService');
        return new CoordinationService(
            c.get<InteropRepository>('interopRepository'),
            c.get<IEventBus>('eventBus'),
            {
                adaptCrew: async (crewId, ops) => {
                    const applied: string[] = [];
                    for (const op of ops) {
                        if (op.op === 'remove' && op.roleId) {
                            await crew.removeRole(crewId, op.roleId);
                            applied.push(`removed ${op.roleId}`);
                        } else if (op.op === 'add') {
                            const role = await crew.addRole(crewId, {
                                name: op.role ?? 'Dynamic Member',
                                role: op.role ?? 'Dynamic Member',
                                goal: 'Injected by dynamic topology adaptation',
                                backstory: 'Added at runtime via coordination service.',
                            });
                            applied.push(`added ${role.id}`);
                        }
                    }
                    return `adapted ${crewId}: ${applied.join(', ') || 'no-op'}`;
                },
                forgeSubCrew: async (goal) => {
                    const proposal = await forge.propose({ goal });
                    const created = await forge.materialize(proposal);
                    return `subcrew ${created.id} forged for "${goal.slice(0, 120)}" (${created.roles.length} roles)`;
                },
            },
        );
    });
};
