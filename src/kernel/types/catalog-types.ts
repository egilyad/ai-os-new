/**
 * Catalog types — AGEMS port, Phase 8.
 */

export interface CatalogAgent {
    id: string;
    slug: string;
    name: string;
    avatar?: string;
    type: string;
    description: string;
    systemPrompt: string;
    llmProvider: string;
    llmModel: string;
    tags: string[];
    toolSlugs: string[];
    skillSlugs: string[];
    authorOrg: string;
    downloads: number;
    createdAt: number;
    updatedAt: number;
}

export interface CatalogSkill {
    id: string;
    slug: string;
    name: string;
    description: string;
    content: string;
    version: string;
    type: 'builtin' | 'plugin' | 'custom';
    tags: string[];
    downloads: number;
    createdAt: number;
    updatedAt: number;
}

export interface CatalogFilters {
    search?: string;
    tags?: string[];
    type?: string;
    authorOrg?: string;
    sortBy?: 'downloads' | 'createdAt' | 'name';
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
