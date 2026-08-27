import type {
    ITemplateSharingService,
    SharedTemplate,
    TemplateCategory,
} from '../contracts/template-sharing';
import type { WorkflowStep } from '../contracts/workflow-types';
import type { PromptLibraryService } from '../services/prompt-library-service';
import type { WorkflowService } from '../services/workflow-service';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-registry';
import { ssrSafeStorage } from '../utils/ssr-storage';

const genId = () => crypto.randomUUID();

const MAX_TEMPLATES = 1000;

const STORAGE_KEY = 'template_sharing:templates';

const SHARED_TEMPLATES: SharedTemplate[] = [
    {
        id: genId(),
        name: 'Research Debate',
        description: 'Structured debate for evaluating research papers',
        category: 'debate',
        author: 'Research Team',
        content: 'TOPIC: {{topic}}\nROUNDS: 3\nSTRATEGY: socratic',
        downloads: 340,
        tags: ['research', 'academic', 'peer-review'],
        createdAt: Date.now() - 86400000 * 14,
        imported: false,
    },
    {
        id: genId(),
        name: 'Code Review Pipeline',
        description: 'Multi-step workflow for automated code review',
        category: 'workflow',
        author: 'DevOps',
        content: 'STEPS:\n  - lint\n  - test\n  - security-scan\n  - review',
        downloads: 890,
        tags: ['code', 'review', 'pipeline'],
        createdAt: Date.now() - 86400000 * 10,
        imported: false,
    },
    {
        id: genId(),
        name: 'Multi-Agent Topology',
        description: 'DAG topology with 8 agents and consensus layer',
        category: 'topology',
        author: 'Core',
        content: 'NODES:\n  - router\n  - agent:4\n  - aggregator\n  - judge',
        downloads: 210,
        tags: ['topology', 'agents', 'dag'],
        createdAt: Date.now() - 86400000 * 7,
        imported: false,
    },
    {
        id: genId(),
        name: 'System Prompt Starter',
        description: 'Base prompt template for system instructions',
        category: 'prompt',
        author: 'Community',
        content: 'You are {{role}}. Your task is to {{task}}.',
        downloads: 1500,
        tags: ['prompt', 'starter', 'system'],
        createdAt: Date.now() - 86400000 * 5,
        imported: false,
    },
    {
        id: genId(),
        name: 'Debate Moderator Agent',
        description: 'Neutral moderator for structured debates',
        category: 'agent',
        author: 'Debate Team',
        content: 'ROLE: moderator\nGOAL: ensure fair turn-taking\nCONSTRAINTS: no bias, time-boxed',
        downloads: 670,
        tags: ['agent', 'moderator', 'debate'],
        createdAt: Date.now() - 86400000 * 3,
        imported: false,
    },
    {
        id: genId(),
        name: 'Socratic Seminar',
        description: 'Socratic method debate template with 5 rounds',
        category: 'debate',
        author: 'Socratic Labs',
        content: 'METHOD: socratic\nROUNDS: 5\nPARTICIPANTS: 3',
        downloads: 430,
        tags: ['socratic', 'debate', 'deep'],
        createdAt: Date.now() - 86400000,
        imported: false,
    },
];

export interface TemplateSharingDeps {
    promptLibraryService?: () => Pick<PromptLibraryService, 'create'>;
    workflowService?: () => Pick<WorkflowService, 'create'>;
    eventBus?: IEventBus;
}

function extractVariables(content: string): string[] {
    const vars = new Set<string>();
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
        if (m[1]) vars.add(m[1]);
    }
    return [...vars];
}

function parseWorkflowSteps(content: string): Omit<WorkflowStep, 'id'>[] {
    const steps: Omit<WorkflowStep, 'id'>[] = [];
    let inSteps = false;
    for (const raw of content.split('\n')) {
        const line = raw.trim();
        if (/^steps?:/i.test(line)) {
            inSteps = true;
            continue;
        }
        if (!inSteps) continue;
        const m = line.match(/^\s*[-*]\s+(.+)$/);
        if (m && m[1]?.trim()) {
            steps.push({
                label: m[1].trim(),
                promptTemplate: '{{INPUT}}',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
            });
        } else if (line && !line.startsWith('#') && !/^[-*]/.test(line)) {
            inSteps = false;
        }
    }
    return steps;
}

export class TemplateSharingService implements ITemplateSharingService {
    private templates: SharedTemplate[];
    private deps: TemplateSharingDeps;

    constructor(deps: TemplateSharingDeps = {}) {
        this.deps = deps;
        const stored = ssrSafeStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as SharedTemplate[];
                this.templates =
                    Array.isArray(parsed) && parsed.length
                        ? parsed
                        : SHARED_TEMPLATES.map((t) => ({ ...t }));
            } catch {
                this.templates = SHARED_TEMPLATES.map((t) => ({ ...t }));
            }
        } else {
            this.templates = SHARED_TEMPLATES.map((t) => ({ ...t }));
            this.save();
        }
    }

    private save(): void {
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates));
    }

    getSharedTemplates(category?: TemplateCategory): SharedTemplate[] {
        let result = this.templates;
        if (category) result = result.filter((t) => t.category === category);
        return result.map((t) => ({ ...t }));
    }

    search(query: string): SharedTemplate[] {
        const q = query.toLowerCase();
        return this.templates
            .filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.tags.some((tag) => tag.includes(q)),
            )
            .map((t) => ({ ...t }));
    }

    importTemplate(id: string): void {
        const t = this.templates.find((tmpl) => tmpl.id === id);
        if (!t || t.imported) return;
        t.imported = true;
        this.save();
        void this.pushToLibrary(t);
    }

    private async pushToLibrary(t: SharedTemplate): Promise<void> {
        try {
            if (t.category === 'prompt' && this.deps.promptLibraryService) {
                await this.deps.promptLibraryService().create({
                    title: t.name,
                    content: t.content,
                    category: t.tags[0] ?? 'general',
                    tags: t.tags,
                    variables: extractVariables(t.content),
                });
                this.notify(`Imported "${t.name}" to Prompt Library`, 'success');
                return;
            }
            if (t.category === 'workflow' && this.deps.workflowService) {
                await this.deps.workflowService().create({
                    title: t.name,
                    description: t.description,
                    steps: parseWorkflowSteps(t.content),
                    tags: t.tags,
                });
                this.notify(`Imported "${t.name}" to Workflow Library`, 'success');
                return;
            }
            this.notify(`Imported "${t.name}"`, 'info');
        } catch {
            this.notify(`Failed to import "${t.name}" into library`, 'error');
        }
    }

    private notify(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
        this.deps.eventBus?.emit(EVENTS.NOTIFICATION, {
            message,
            type,
            source: 'template-sharing',
        });
    }

    exportTemplate(
        data: Omit<SharedTemplate, 'id' | 'createdAt' | 'imported' | 'downloads'>,
    ): SharedTemplate {
        const t: SharedTemplate = {
            ...data,
            id: genId(),
            downloads: 0,
            createdAt: Date.now(),
            imported: true,
        };
        if (this.templates.length >= MAX_TEMPLATES) {
            this.templates.shift();
        }
        this.templates.push(t);
        this.save();
        return { ...t };
    }

    getImported(): SharedTemplate[] {
        return this.templates.filter((t) => t.imported).map((t) => ({ ...t }));
    }

    publishTemplate(
        data: Omit<SharedTemplate, 'id' | 'createdAt' | 'imported' | 'downloads'>,
    ): SharedTemplate {
        const t: SharedTemplate = {
            ...data,
            id: genId(),
            downloads: 0,
            createdAt: Date.now(),
            imported: false,
        };
        if (this.templates.length >= MAX_TEMPLATES) {
            this.templates.shift();
        }
        this.templates.push(t);
        this.save();
        return { ...t };
    }
}
