/**
 * Project template contract (roadmapp.md §P12).
 */
import type { ProjectTemplate, TemplateCategory, TemplateSummary } from '../types/template-types';

export interface IProjectTemplateService {
    listTemplates(category?: TemplateCategory): TemplateSummary[];
    getTemplate(templateId: string): ProjectTemplate | undefined;
    applyTemplate(templateId: string, projectId: string): Promise<number>;
    createTemplate(name: string, category: TemplateCategory, files: import('../types/template-types').TemplateFile[], description?: string, tags?: string[]): ProjectTemplate;
}
