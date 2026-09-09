/**
 * Phase 29 — Meta & unified memory (Roadmap Phase B).
 *
 * Registers:
 *   - `metaRepository` (DAL over 8 v29 tables)
 *   - `metaAgentService` (improvement loop + skill evolution via SkillMarket
 *     delegate + health signals)
 *   - `strategyService` (experience replay + recursive decomposition)
 *   - `cogMemoryService` (episodic/semantic/procedural/identity + scopes +
 *     governance + counterfactuals + knowledge packages)
 *
 * Additive — MetaLearning / Crystals / LtMemory / SkillMarket untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ISkillMarketService } from '../contracts/ops';
import { MetaRepository } from '../dal/meta-repository';
import { MetaAgentService } from '../services/meta/meta-agent-service';
import { StrategyService } from '../services/meta/strategy-service';
import { CogMemoryService } from '../services/meta/cog-memory-service';

export const registerPhase29: Phase = ({ register }) => {
    register('metaRepository', (c: IContainer) => {
        return new MetaRepository(c.get<DatabaseService>('database'));
    });

    register('metaAgentService', (c: IContainer) => {
        const skills = c.get<ISkillMarketService>('skillMarketService');
        return new MetaAgentService(
            c.get<MetaRepository>('metaRepository'),
            c.get<IEventBus>('eventBus'),
            {
                publishSkill: async (input) => {
                    const manifest = await skills.publish({
                        name: input.name,
                        version: '0.1.0',
                        description: `Evolved from pattern: ${input.pattern.slice(0, 280)}`,
                        permissions: input.permissions ?? [],
                        entry: 'evolved.ts',
                        author: 'meta-agent',
                    });
                    return `${manifest.id} (${manifest.name}@${manifest.version})`;
                },
            },
        );
    });

    register('strategyService', (c: IContainer) => {
        return new StrategyService(c.get<MetaRepository>('metaRepository'));
    });

    register('cogMemoryService', (c: IContainer) => {
        return new CogMemoryService(
            c.get<MetaRepository>('metaRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
