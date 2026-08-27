import type { CognitiveSkill } from '../types/domain-types';
import { CognitiveSkillSchema } from '../types/schema-types';
import { EVENTS } from '../events/event-names';
import type { SkillsStore } from '../contracts/storage/skills-store';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('SkillService');

export interface SkillServiceDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    skillsStore: SkillsStore;
}

const DEFAULT_SKILLS: CognitiveSkill[] = [
    {
        id: 'sk-1',
        name: 'Deep Web Researcher',
        description:
            'Performs multi-step parallel searches, extracts semantic content, and synthesizes comprehensive research briefs.',
        category: 'analysis',
        status: 'active',
        toolsUsed: ['Google Search API', 'Web Scraper', 'Summarizer'],
        version: '2.1.0',
        executionCount: 47,
    },
    {
        id: 'sk-2',
        name: 'Code Reviewer Pro',
        description:
            'Analyzes PRs or local codebases for security vulnerabilities, style violations, and algorithmic inefficiencies.',
        category: 'analysis',
        status: 'installed',
        toolsUsed: ['Git CLI', 'AST Parser', 'Linter'],
        version: '1.4.2',
        executionCount: 23,
    },
    {
        id: 'sk-3',
        name: 'Social Media Manager',
        description:
            'Monitors trends, generates contextual content schedules, and orchestrates multi-platform posting.',
        category: 'generation',
        status: 'not_installed',
        toolsUsed: ['Twitter API', 'LinkedIn API', 'Image Gen'],
        version: '3.0.1',
        executionCount: 0,
    },
    {
        id: 'sk-4',
        name: 'Data Visualization Agent',
        description:
            'Ingests raw CSV/JSON data and autonomously generates python matplotlib/seaborn code to render charts.',
        category: 'generation',
        status: 'active',
        toolsUsed: ['Python Sandbox', 'Pandas'],
        version: '1.0.5',
        executionCount: 12,
    },
    {
        id: 'sk-5',
        name: 'Swarm Orchestrator',
        description:
            'Advanced skill to dynamically spawn sub-agents, distribute tasks, and aggregate results for complex goals.',
        category: 'orchestration',
        status: 'installed',
        toolsUsed: ['Docker CLI', 'Agent Router'],
        version: '0.9.0-beta',
        executionCount: 8,
    },
];

export class SkillService {
    private deps: SkillServiceDeps;
    private skills: CognitiveSkill[] = [];
    private _initialized = false;

    constructor(deps: SkillServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
    }

    destroy() {
        this.skills = [];
    }

    private async load() {
        try {
            const count = await this.deps.skillsStore.count();
            if (count > 0) {
                this.skills = await this.deps.skillsStore.toArray();
            } else {
                this.skills = DEFAULT_SKILLS;
                await this.deps.skillsStore.bulkAdd(this.skills);
            }
        } catch (e) {
            LOGGER.error('SkillService', 'Failed to load skills', { error: e });
            this.skills = DEFAULT_SKILLS;
        }
    }

    private async persist() {
        try {
            await this.deps.skillsStore.bulkPut(this.skills);
        } catch (e) {
            LOGGER.error('SkillService', 'Failed to persist skills', { error: e });
        }
    }

    private emit() {
        this.deps.eventBus.emit(EVENTS.SKILLS_UPDATED, this.skills);
    }

    getSkills(): CognitiveSkill[] {
        return this.skills;
    }

    getInstalled(): CognitiveSkill[] {
        return this.skills.filter((s) => s.status !== 'not_installed');
    }

    getAvailable(): CognitiveSkill[] {
        return this.skills.filter((s) => s.status === 'not_installed');
    }

    async toggleActive(id: string) {
        this.skills = this.skills.map((s) => {
            if (s.id === id && s.status !== 'not_installed') {
                return { ...s, status: s.status === 'active' ? 'installed' : ('active' as const) };
            }
            return s;
        });
        await this.persist();
        this.emit();
    }

    async installSkill(id: string) {
        this.skills = this.skills.map((s) =>
            s.id === id ? { ...s, status: 'installed' as const } : s,
        );
        await this.persist();
        this.emit();
    }

    async incrementExecution(id: string) {
        this.skills = this.skills.map((s) =>
            s.id === id ? { ...s, executionCount: s.executionCount + 1 } : s,
        );
        await this.persist();
    }

    exportSkills(): string {
        return JSON.stringify(this.skills, null, 2);
    }

    async importSkills(jsonData: string): Promise<number> {
        try {
            const imported = safeJsonParse(jsonData);
            if (!Array.isArray(imported)) throw new Error('Invalid format');

            let count = 0;
            for (const item of imported) {
                const parsed = CognitiveSkillSchema.parse(item);
                const exists = this.skills.some((s) => s.id === parsed.id);
                if (!exists) {
                    this.skills.push(parsed);
                    count++;
                }
            }

            await this.persist();
            this.emit();
            return count;
        } catch (e) {
            LOGGER.error('SkillService', 'Failed to import skills', { error: e });
            throw new Error('Failed to import skills', { cause: e });
        }
    }
}
