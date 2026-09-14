/**
 * Project template types (roadmapp.md §P12).
 */

export type TemplateCategory = 'website' | 'python' | 'library' | 'api';

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    tags: string[];
    files: TemplateFile[];
    requirements?: string[];
    entryPoint?: string;
    createdAt: number;
}

export interface TemplateFile {
    path: string;
    content: string;
}

export interface TemplateSummary {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    tags: string[];
    fileCount: number;
}
