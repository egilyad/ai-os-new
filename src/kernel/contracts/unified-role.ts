export type RoleCategoryExtended =
    | 'philosopher'
    | 'scientist'
    | 'politician'
    | 'artist'
    | 'technologist'
    | 'writer'
    | 'strategist'
    | 'religious'
    | 'mythical'
    | 'economist'
    | 'psychologist'
    | 'activist'
    | 'explorer'
    | 'modern_thinker'
    | 'fiction_literature'
    | 'fiction_film'
    | 'archetype'
    | 'profession'
    | 'cultural'
    | 'psychotype'
    | 'academic'
    | 'media'
    | 'anthropomorphic'
    | 'neural'
    | 'stereotype'
    | 'technical'
    | 'analytical'
    | 'creative'
    | 'management';

export interface UnifiedRoleEntry {
    id: string;
    name: string;
    category: RoleCategoryExtended;
    description: string;
    systemPrompt: string;
    temperature: number;
    tools: string[];
    constraints: string[];
    inherits: string[];
    consortia: string[];
    groups: string[];
    permissions: string[];
    metadata: {
        version: number;
        author: string;
        tags: string[];
        complexity: 1 | 2 | 3 | 4 | 5;
        maturity: 'draft' | 'stable' | 'deprecated';
    };
}

export interface Consilium {
    id: string;
    name: string;
    type: ConsiliumType;
    description: string;
    roles: string[];
    minParticipants: number;
    maxParticipants: number;
    goals: string[];
    rules: string[];
}

export type ConsiliumType =
    | 'board'
    | 'council'
    | 'studio'
    | 'clinic'
    | 'court'
    | 'parliament'
    | 'lab'
    | 'committee'
    | 'squad'
    | 'guild';

export interface GroupTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
    roles: string[];
    minSize: number;
    maxSize: number;
    tags: string[];
}

export type TemplateCategory =
    | 'analysis'
    | 'creative'
    | 'technical'
    | 'business'
    | 'academic'
    | 'legal'
    | 'medical'
    | 'military'
    | 'social';

export interface IUnifiedRoleRegistry {
    listRoles(category?: RoleCategoryExtended): UnifiedRoleEntry[];
    getRole(id: string): UnifiedRoleEntry | undefined;
    searchRoles(query: string): UnifiedRoleEntry[];
    listConsilia(type?: ConsiliumType): Consilium[];
    getConsilium(id: string): Consilium | undefined;
    listTemplates(category?: TemplateCategory): GroupTemplate[];
    getTemplate(id: string): GroupTemplate | undefined;
    getCategories(): RoleCategoryExtended[];
    getConsiliumTypes(): ConsiliumType[];
    getTemplateCategories(): TemplateCategory[];
}
