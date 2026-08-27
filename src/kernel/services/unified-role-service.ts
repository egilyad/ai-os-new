import type {
    IUnifiedRoleRegistry,
    UnifiedRoleEntry,
    Consilium,
    GroupTemplate,
    RoleCategoryExtended,
    ConsiliumType,
    TemplateCategory,
} from '../contracts/unified-role';
import { ROLE_DEFINITIONS } from '../../data/role-definitions';
import { CONSILIUM_DEFINITIONS } from './consilium-definitions';
import { GROUP_TEMPLATES } from './group-template-definitions';

export class UnifiedRoleRegistry implements IUnifiedRoleRegistry {
    private readonly roles: Map<string, UnifiedRoleEntry>;
    private readonly consilia: Map<string, Consilium>;
    private readonly templates: Map<string, GroupTemplate>;

    constructor() {
        this.roles = new Map(ROLE_DEFINITIONS.map((r) => [r.id, r]));
        this.consilia = new Map(CONSILIUM_DEFINITIONS.map((c) => [c.id, c]));
        this.templates = new Map(GROUP_TEMPLATES.map((t) => [t.id, t]));
    }

    listRoles(category?: RoleCategoryExtended): UnifiedRoleEntry[] {
        const all = [...this.roles.values()];
        return category ? all.filter((r) => r.category === category) : all;
    }

    getRole(id: string): UnifiedRoleEntry | undefined {
        return this.roles.get(id);
    }

    searchRoles(query: string): UnifiedRoleEntry[] {
        const q = query.toLowerCase();
        return [...this.roles.values()].filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                r.metadata.tags.some((t) => t.includes(q)),
        );
    }

    listConsilia(type?: ConsiliumType): Consilium[] {
        const all = [...this.consilia.values()];
        return type ? all.filter((c) => c.type === type) : all;
    }

    getConsilium(id: string): Consilium | undefined {
        return this.consilia.get(id);
    }

    listTemplates(category?: TemplateCategory): GroupTemplate[] {
        const all = [...this.templates.values()];
        return category ? all.filter((t) => t.category === category) : all;
    }

    getTemplate(id: string): GroupTemplate | undefined {
        return this.templates.get(id);
    }

    getCategories(): RoleCategoryExtended[] {
        const cats = new Set([...this.roles.values()].map((r) => r.category));
        return [...cats];
    }

    getConsiliumTypes(): ConsiliumType[] {
        return [...new Set([...this.consilia.values()].map((c) => c.type))];
    }

    getTemplateCategories(): TemplateCategory[] {
        return [...new Set([...this.templates.values()].map((t) => t.category))];
    }
}
