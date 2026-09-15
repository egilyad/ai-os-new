/**
 * Phase 75 — Catalog Service (AGEMS port, Phase 8).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { CatalogService } from '../services/catalog-service';

export const registerPhase75: Phase = ({ register }) => {
    register('catalogService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new CatalogService({
            catalogAgents: db.catalogAgents,
            catalogSkills: db.catalogSkills,
        });
    });
};
