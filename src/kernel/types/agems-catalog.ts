/**
 * AGEMS Catalog types — leaf module with zero runtime imports.
 *
 * Moved out of services/agems-catalog-service.ts so that
 * services/dexie-schema.ts can reference these table row types without
 * creating a services ↔ services edge (database-service → dexie-schema →
 * agems-catalog-service → … circular dependency).
 */

export interface CatalogAgent {
    id?: number;
    slug: string;
    name: string;
    description: string;
    systemPrompt: string;
    llmProvider: string;
    llmModel: string;
    tags: string[];
    toolSlugs: string[];
    skillSlugs: string[];
    authorOrg?: string;
    downloads: number;
}

export interface CatalogSkill {
    id?: number;
    slug: string;
    name: string;
    description: string;
    content: string;
    version: string;
    type: string;
    tags: string[];
    downloads: number;
}

export interface CatalogTool {
    id?: number;
    slug: string;
    name: string;
    description: string;
    type: string;
    configTemplate: Record<string, unknown>;
    tags: string[];
    downloads: number;
}
