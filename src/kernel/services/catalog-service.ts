/**
 * Catalog Service — AGEMS port, Phase 8.
 * Browse, search, import agents and skills from a catalog.
 */
import type { CatalogAgent, CatalogSkill, CatalogFilters } from '../types/catalog-types';
import { rootLogger } from './logger-service';

const log = rootLogger.child('CatalogService');

let counter = 0;

export class CatalogService {
    private db: {
        catalogAgents: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        catalogSkills: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
    };

    constructor(db: {
        catalogAgents: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        catalogSkills: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
    }) {
        this.db = db;
    }

    private genId(prefix: string): string {
        return `${prefix}-${Date.now()}-${++counter}`;
    }

    // ── Agent Catalog ──

    async listAgents(filters?: CatalogFilters): Promise<CatalogAgent[]> {
        let agents = await this.db.catalogAgents.toArray() as unknown as CatalogAgent[];
        if (filters) {
            if (filters.search) {
                const q = filters.search.toLowerCase();
                agents = agents.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
            }
            if (filters.tags?.length) {
                agents = agents.filter(a => filters.tags!.some(t => a.tags.includes(t)));
            }
            if (filters.type) {
                agents = agents.filter(a => a.type === filters.type);
            }
            if (filters.authorOrg) {
                agents = agents.filter(a => a.authorOrg === filters.authorOrg);
            }
        }
        const sortBy = filters?.sortBy ?? 'downloads';
        const sortDir = filters?.sortDir ?? 'desc';
        agents.sort((a, b) => {
            const av = a[sortBy] ?? 0;
            const bv = b[sortBy] ?? 0;
            if (typeof av === 'string' && typeof bv === 'string') {
                return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 50;
        return agents.slice(offset, offset + limit);
    }

    async getAgent(id: string): Promise<CatalogAgent | undefined> {
        const record = await this.db.catalogAgents.get(id);
        return record as unknown as CatalogAgent | undefined;
    }

    async importAgent(input: Omit<CatalogAgent, 'id' | 'downloads' | 'createdAt' | 'updatedAt'>): Promise<CatalogAgent> {
        const now = Date.now();
        const agent: CatalogAgent = {
            ...input,
            id: this.genId('catalog-agent'),
            downloads: 0,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.catalogAgents.put(agent as unknown as Record<string, unknown>);
        log.info('importAgent', `Imported agent "${agent.name}" (${agent.id})`);
        return agent;
    }

    async removeAgent(id: string): Promise<void> {
        await this.db.catalogAgents.delete(id);
    }

    async incrementAgentDownloads(id: string): Promise<void> {
        const agent = await this.getAgent(id);
        if (!agent) return;
        agent.downloads += 1;
        agent.updatedAt = Date.now();
        await this.db.catalogAgents.put(agent as unknown as Record<string, unknown>);
    }

    // ── Skill Catalog ──

    async listSkills(filters?: CatalogFilters): Promise<CatalogSkill[]> {
        let skills = await this.db.catalogSkills.toArray() as unknown as CatalogSkill[];
        if (filters) {
            if (filters.search) {
                const q = filters.search.toLowerCase();
                skills = skills.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
            }
            if (filters.tags?.length) {
                skills = skills.filter(s => filters.tags!.some(t => s.tags.includes(t)));
            }
            if (filters.type) {
                skills = skills.filter(s => s.type === filters.type);
            }
        }
        const sortBy = filters?.sortBy ?? 'downloads';
        const sortDir = filters?.sortDir ?? 'desc';
        skills.sort((a, b) => {
            const av = a[sortBy] ?? 0;
            const bv = b[sortBy] ?? 0;
            if (typeof av === 'string' && typeof bv === 'string') {
                return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 50;
        return skills.slice(offset, offset + limit);
    }

    async getSkill(id: string): Promise<CatalogSkill | undefined> {
        const record = await this.db.catalogSkills.get(id);
        return record as unknown as CatalogSkill | undefined;
    }

    async importSkill(input: Omit<CatalogSkill, 'id' | 'downloads' | 'createdAt' | 'updatedAt'>): Promise<CatalogSkill> {
        const now = Date.now();
        const skill: CatalogSkill = {
            ...input,
            id: this.genId('catalog-skill'),
            downloads: 0,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.catalogSkills.put(skill as unknown as Record<string, unknown>);
        log.info('importSkill', `Imported skill "${skill.name}" (${skill.id})`);
        return skill;
    }

    async removeSkill(id: string): Promise<void> {
        await this.db.catalogSkills.delete(id);
    }

    async incrementSkillDownloads(id: string): Promise<void> {
        const skill = await this.getSkill(id);
        if (!skill) return;
        skill.downloads += 1;
        skill.updatedAt = Date.now();
        await this.db.catalogSkills.put(skill as unknown as Record<string, unknown>);
    }

    // ── Search across both ──

    async search(query: string): Promise<{ agents: CatalogAgent[]; skills: CatalogSkill[] }> {
        const agents = await this.listAgents({ search: query });
        const skills = await this.listSkills({ search: query });
        return { agents, skills };
    }
}
