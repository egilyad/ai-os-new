/**
 * Catalog service contract — AGEMS port, Phase 8.
 */
import type { CatalogAgent, CatalogSkill, CatalogFilters } from '../types/catalog-types';

export interface ICatalogService {
    // Agents
    listAgents(filters?: CatalogFilters): Promise<CatalogAgent[]>;
    getAgent(id: string): Promise<CatalogAgent | undefined>;
    importAgent(input: Omit<CatalogAgent, 'id' | 'downloads' | 'createdAt' | 'updatedAt'>): Promise<CatalogAgent>;
    removeAgent(id: string): Promise<void>;
    incrementAgentDownloads(id: string): Promise<void>;

    // Skills
    listSkills(filters?: CatalogFilters): Promise<CatalogSkill[]>;
    getSkill(id: string): Promise<CatalogSkill | undefined>;
    importSkill(input: Omit<CatalogSkill, 'id' | 'downloads' | 'createdAt' | 'updatedAt'>): Promise<CatalogSkill>;
    removeSkill(id: string): Promise<void>;
    incrementSkillDownloads(id: string): Promise<void>;

    // Search
    search(query: string): Promise<{ agents: CatalogAgent[]; skills: CatalogSkill[] }>;
}
