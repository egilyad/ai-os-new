import type { ISNode } from '../contracts/topology';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('TemplateService');

export interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    node: Omit<ISNode, 'id' | 'position'>;
    created: number;
    updated: number;
}

export interface TemplateServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

const TEMPLATES_KEY = 'super_agents_agent_templates';

export class TemplateService {
    private deps: TemplateServiceDeps;
    private templates: AgentTemplate[] = [];
    private initPromise: Promise<void> | null = null;
    private _initialized = false;

    constructor(deps: TemplateServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        const saved = await this.deps.database.getKv<AgentTemplate[]>(TEMPLATES_KEY);
        if (saved) this.templates = saved;
    }

    // SR-1: Ensure init is awaited before reading templates
    private async ensureReady(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.init();
        }
        await this.initPromise;
    }

    async saveAsTemplate(node: ISNode, description?: string): Promise<AgentTemplate> {
        const { id: _nodeId, position: _pos, ...rest } = node;
        void _nodeId;
        void _pos;
        const existing = this.templates.find((t) => t.name === rest.label);
        if (existing) {
            existing.node = rest;
            existing.description = description || existing.description;
            existing.updated = Date.now();
            await this.persist();
            return existing;
        }
        const tmpl: AgentTemplate = {
            id: `tmpl-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
            name: rest.label,
            description: description || '',
            node: rest,
            created: Date.now(),
            updated: Date.now(),
        };
        this.templates.push(tmpl);
        await this.persist();
        return tmpl;
    }

    async getTemplates(): Promise<AgentTemplate[]> {
        await this.ensureReady();
        return [...this.templates].sort((a, b) => b.updated - a.updated);
    }

    async deleteTemplate(id: string) {
        this.templates = this.templates.filter((t) => t.id !== id);
        await this.persist();
    }

    destroy(): void {
        this._initialized = false;
        this.templates = [];
        this.initPromise = null;
    }

    private async persist() {
        try {
            await this.deps.database.setKv(TEMPLATES_KEY, this.templates);
        } catch (e) {
            LOGGER.warn('TemplateService', 'Persist failed', { error: e });
        }
    }
}
