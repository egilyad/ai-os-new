/**
 * Phase 30 — Trust & ecosystem (Roadmap Phase C).
 *
 * Registers:
 *   - `trustRepository` (DAL over 10 v30 tables)
 *   - `governanceService` (capabilities + trust + policies + human roles,
 *     audited via AuditService)
 *   - `provenanceService` (decision ancestry graph + sandbox continuum)
 *   - `ecosystemService` (extensions, one-action bundles via real
 *     Crew/SkillMarket/LtMemory delegates, surfaces, OS config, snapshots)
 *
 * Additive — policy/MCP/sandbox/skill/time-machine runtimes untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { IAuditService } from '../contracts/ops';
import type { ICrewService } from '../contracts/crew';
import type { ISkillMarketService } from '../contracts/ops';
import type { ILtMemoryService } from '../contracts/persona';
import { TrustRepository } from '../dal/trust-repository';
import { GovernanceService } from '../services/trust/governance-service';
import { ProvenanceService } from '../services/trust/provenance-service';
import { EcosystemService } from '../services/trust/ecosystem-service';

export const registerPhase30: Phase = ({ register }) => {
    register('trustRepository', (c: IContainer) => {
        return new TrustRepository(c.get<DatabaseService>('database'));
    });

    register('governanceService', (c: IContainer) => {
        return new GovernanceService(
            c.get<TrustRepository>('trustRepository'),
            c.get<IEventBus>('eventBus'),
            c.get<IAuditService>('auditService'),
        );
    });

    register('provenanceService', (c: IContainer) => {
        return new ProvenanceService(c.get<TrustRepository>('trustRepository'));
    });

    register('ecosystemService', (c: IContainer) => {
        const crew = c.get<ICrewService>('crewService');
        const skills = c.get<ISkillMarketService>('skillMarketService');
        const memory = c.get<ILtMemoryService>('ltMemoryService');
        const db = c.get<DatabaseService>('database');
        return new EcosystemService(
            c.get<TrustRepository>('trustRepository'),
            c.get<IEventBus>('eventBus'),
            c.get<IAuditService>('auditService'),
            {
                importAgentCard: async (json: string) => {
                    const card = crew.importCard(json);
                    const role = await crew.addRole(
                        (await crew.createCrew({ name: `Bundle: ${card.name}` })).id,
                        crew.roleFromCard(card),
                    );
                    return role.id;
                },
                createCrew: async (name: string, process?: string) => {
                    const created = await crew.createCrew({
                        name,
                        process: (process as 'sequential' | 'hierarchical') ?? 'sequential',
                    });
                    return created.id;
                },
                installSkill: async (skillRef: string) => {
                    const all = await skills.list();
                    const found = all.find((s) => s.id === skillRef || s.name === skillRef);
                    if (!found) return `unknown-skill:${skillRef}`;
                    await skills.install(found.id);
                    return found.id;
                },
                rememberMemory: async (ownerId: string, content: string) => {
                    const m = await memory.remember({ ownerId, content });
                    return m.id;
                },
                tableInventory: async () => {
                    const tables = [
                        'crews',
                        'councilSessions',
                        'graphRuns',
                        'ltMemories',
                        'goals',
                        'policyRules',
                        'bundles',
                    ] as const;
                    const out: Array<{ table: string; count: number; digest: string }> = [];
                    for (const t of tables) {
                        try {
                            const rows = await (db[t] as { toArray: () => Promise<unknown[]> }).toArray();
                            const json = JSON.stringify(rows.length);
                            let h = 0x811c9dc5;
                            const s = `${t}:${json}`;
                            for (let i = 0; i < s.length; i++) {
                                h ^= s.charCodeAt(i);
                                h = Math.imul(h, 0x01000193) >>> 0;
                            }
                            out.push({ table: t, count: rows.length, digest: h.toString(16) });
                        } catch {
                            out.push({ table: t, count: -1, digest: 'error' });
                        }
                    }
                    return out;
                },
            },
        );
    });
};
