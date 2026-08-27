export type TemplateCategory = 'debate' | 'workflow' | 'topology' | 'prompt' | 'agent';

export interface SharedTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    author: string;
    content: string;
    downloads: number;
    tags: string[];
    createdAt: number;
    imported: boolean;
}

export interface ITemplateSharingService {
    getSharedTemplates(category?: TemplateCategory): SharedTemplate[];
    search(query: string): SharedTemplate[];
    importTemplate(id: string): void;
    exportTemplate(
        template: Omit<SharedTemplate, 'id' | 'createdAt' | 'imported' | 'downloads'>,
    ): SharedTemplate;
    getImported(): SharedTemplate[];
    publishTemplate(
        template: Omit<SharedTemplate, 'id' | 'createdAt' | 'imported' | 'downloads'>,
    ): SharedTemplate;
}
