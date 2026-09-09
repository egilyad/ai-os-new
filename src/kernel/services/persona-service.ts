/**
 * Chat Persona Service
 * Manages persona library, system prompts, and quick switching
 */

import { genId } from '../../utils/gen-id';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import { BucketStorageAdapter } from './storage-adapter';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
// Note: rootLogger is re-exported from ../instances for DI consumers

const LOGGER = rootLogger.child('PersonaService');

export interface Persona {
    id: string;
    name: string;
    icon: string;
    systemPrompt: string;
    temperature?: number;
    model?: string;
    provider?: string;
    color?: string;
    isBuiltIn: boolean;
    createdAt: number;
    updatedAt: number;
    tags: string[];
    description: string;
}

export interface PersonaPreset {
    id: string;
    name: string;
    icon: string;
    systemPrompt: string;
    temperature: number;
    tags: string[];
    description: string;
}

// Built-in personas
const BUILT_IN_PERSONAS: PersonaPreset[] = [
    {
        id: 'teacher',
        name: 'Teacher',
        icon: '🎓',
        systemPrompt:
            "You are a patient, encouraging teacher who explains concepts clearly and adapts to the student's level. Use examples and analogies to make complex ideas accessible. Ask follow-up questions to check understanding.",
        temperature: 0.7,
        tags: ['education', 'learning'],
        description: 'Patient educator who explains concepts with examples',
    },
    {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        icon: '🔍',
        systemPrompt:
            'You are a thorough code reviewer focused on quality, security, and maintainability. Provide specific, actionable feedback with code examples. Highlight potential bugs, performance issues, and style violations.',
        temperature: 0.3,
        tags: ['coding', 'review', 'quality'],
        description: 'Critical reviewer for code quality and security',
    },
    {
        id: 'creative-writer',
        name: 'Creative Writer',
        icon: '✍️',
        systemPrompt:
            'You are a creative writer who brings imagination and flair to every response. Use vivid language, storytelling techniques, and engaging narratives. Feel free to explore unconventional ideas and metaphors.',
        temperature: 0.9,
        tags: ['writing', 'creative', 'stories'],
        description: 'Imaginative writer with storytelling skills',
    },
    {
        id: 'data-analyst',
        name: 'Data Analyst',
        icon: '📊',
        systemPrompt:
            'You are a data analyst who approaches problems methodically with statistics and evidence. Present findings clearly with supporting data. Acknowledge uncertainty and limitations in the analysis.',
        temperature: 0.2,
        tags: ['analysis', 'data', 'statistics'],
        description: 'Methodical analyst focused on data-driven insights',
    },
    {
        id: 'therapist',
        name: 'Therapist',
        icon: '💚',
        systemPrompt:
            'You are an empathetic therapist who listens actively and helps users explore their thoughts and feelings. Ask open-ended questions, validate emotions, and guide reflections without giving direct advice.',
        temperature: 0.8,
        tags: ['support', 'wellbeing', 'counseling'],
        description: 'Empathetic listener who guides self-reflection',
    },
    {
        id: 'socratic',
        name: 'Socratic Guide',
        icon: '🏛️',
        systemPrompt:
            'You guide conversations through questions rather than answers. Challenge assumptions, explore implications, and help users arrive at insights through their own reasoning. Never give direct answers — ask instead.',
        temperature: 0.6,
        tags: ['philosophy', 'critical-thinking', 'questions'],
        description: 'Uses questions to guide deeper thinking',
    },
    {
        id: 'devops',
        name: 'DevOps Engineer',
        icon: '⚙️',
        systemPrompt:
            'You are a DevOps engineer focused on automation, reliability, and infrastructure. Suggest CI/CD pipelines, monitoring solutions, containerization, and infrastructure-as-code. Prioritize system resilience.',
        temperature: 0.3,
        tags: ['devops', 'infrastructure', 'automation'],
        description: 'Infrastructure expert for automation and reliability',
    },
    {
        id: 'product-manager',
        name: 'Product Manager',
        icon: '📋',
        systemPrompt:
            'You think like a product manager: prioritize ruthlessly, consider user impact, balance scope against resources. Ask about success metrics, stakeholders, and trade-offs. Suggest MVPs and iterative development.',
        temperature: 0.5,
        tags: ['product', 'management', 'strategy'],
        description: 'Strategic thinker for product decisions and prioritization',
    },
];

export type TonePreset = 'formal' | 'friendly' | 'sarcastic' | 'concise' | 'verbose';

const TONE_PROMPTS: Record<TonePreset, string> = {
    formal: 'Use formal language and professional tone. Avoid contractions and colloquialisms.',
    friendly: 'Use a warm, friendly tone. Be conversational and approachable.',
    sarcastic: 'Use dry humor and light sarcasm where appropriate. Be witty but not mean.',
    concise:
        'Be brief and to the point. Avoid unnecessary elaboration. Get straight to the answer.',
    verbose: 'Provide thorough, detailed responses. Explain your reasoning fully.',
};

const TONE_TEMPERATURE_ADJUSTMENT: Record<TonePreset, number> = {
    formal: -0.1,
    friendly: 0.1,
    sarcastic: 0.15,
    concise: -0.15,
    verbose: 0.05,
};

export class PersonaService {
    private personas: Map<string, Persona> = new Map();
    private activePersonaId: string | null = null;
    private activeTone: TonePreset = 'friendly';
    private isInitialized = false;
    private _database: IDatabaseService | null = null;
    private _eventBus: IEventBus | null = null;

    constructor(database?: IDatabaseService, eventBus?: IEventBus) {
        this._database = database ?? null;
        this._eventBus = eventBus ?? null;
    }

    /** Inject database after construction (for DI registration).
     *  If already initialized, reloads custom personas from the new database. */
    setDatabase(db: IDatabaseService): void {
        this._database = db;
        if (this.isInitialized) {
            this.isInitialized = false;
            this.init().catch((e) =>
                LOGGER.error('PersonaService', 'reload after setDatabase failed', {
                    error: String(e),
                }),
            );
        }
    }

    private get db(): IDatabaseService | null {
        return this._database;
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;

        // Load built-in personas
        for (const preset of BUILT_IN_PERSONAS) {
            const persona: Persona = {
                id: preset.id,
                name: preset.name,
                icon: preset.icon,
                systemPrompt: preset.systemPrompt,
                temperature: preset.temperature,
                isBuiltIn: true,
                createdAt: 0, // Built-in, no creation time
                updatedAt: 0,
                tags: preset.tags,
                description: preset.description,
            };
            this.personas.set(preset.id, persona);
        }

        // Load custom personas from storage (with localStorage migration fallback)
        let custom: { id: string; persona: Persona }[] | null = null;
        if (this.db) {
            const raw = await this.db.getKv<{ id: string; persona: Persona }[]>('customPersonas');
            if (raw) custom = raw;
        }
        if (!custom) {
            const raw =
                await BucketStorageAdapter.UI.get<{ id: string; persona: Persona }[]>(
                    'customPersonas',
                );
            if (raw) {
                custom = raw;
                // Migrate to database on first read
                if (this.db) {
                    await this.db.setKv('customPersonas', custom);
                    await BucketStorageAdapter.UI.remove('customPersonas');
                }
            }
        }
        if (custom) {
            for (const { persona } of custom) {
                this.personas.set(persona.id, persona);
            }
        }

        this.isInitialized = true;
        LOGGER.info('PersonaService', `Initialized with ${this.personas.size} personas`);
    }

    /**
     * Get all personas
     */
    getAll(): Persona[] {
        return Array.from(this.personas.values());
    }

    /**
     * Get persona by ID
     */
    getById(id: string): Persona | undefined {
        return this.personas.get(id);
    }

    /**
     * Get active persona (or null)
     */
    getActive(): Persona | null {
        return this.activePersonaId ? this.personas.get(this.activePersonaId) || null : null;
    }

    /**
     * Get active system prompt (with tone adjustment)
     */
    getSystemPrompt(): string {
        const persona = this.getActive();
        const tonePrompt = TONE_PROMPTS[this.activeTone];

        if (persona) {
            return `${persona.systemPrompt}\n\n${tonePrompt}`;
        }
        return tonePrompt;
    }

    /**
     * Get effective temperature (persona + tone adjusted)
     */
    getEffectiveTemperature(): number {
        const persona = this.getActive();
        const baseTemp = persona?.temperature ?? 0.7;
        const adjustment = TONE_TEMPERATURE_ADJUSTMENT[this.activeTone];
        return Math.max(0, Math.min(2, baseTemp + adjustment));
    }

    /**
     * Set active persona
     */
    setActive(personaId: string | null): void {
        this.activePersonaId = personaId;
        this._eventBus?.emit(EVENTS.PERSONA_CHANGED, {
            personaId,
            persona: personaId ? this.getById(personaId) : null,
        });
        LOGGER.info('PersonaService', 'Active persona changed', { personaId });
    }

    /**
     * Set tone preset
     */
    setTone(tone: TonePreset): void {
        this.activeTone = tone;
        this._eventBus?.emit(EVENTS.PERSONA_TONE_CHANGED, { tone });
        LOGGER.info('PersonaService', 'Tone changed', { tone });
    }

    /**
     * Get current tone
     */
    getTone(): TonePreset {
        return this.activeTone;
    }

    /**
     * Get all available tones
     */
    getTones(): TonePreset[] {
        return ['formal', 'friendly', 'sarcastic', 'concise', 'verbose'];
    }

    /**
     * Create custom persona
     */
    async create(
        data: Omit<Persona, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>,
    ): Promise<Persona> {
        const id = genId('custom');
        const persona: Persona = {
            ...data,
            id,
            isBuiltIn: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.personas.set(id, persona);
        await this.saveCustomPersonas();
        this._eventBus?.emit(EVENTS.PERSONA_CREATED, persona);
        LOGGER.info('PersonaService', 'Custom persona created', { id, name: persona.name });
        return persona;
    }

    /**
     * Update custom persona
     */
    async update(
        id: string,
        data: Partial<Omit<Persona, 'id' | 'isBuiltIn' | 'createdAt'>>,
    ): Promise<Persona | null> {
        const existing = this.personas.get(id);
        if (!existing || existing.isBuiltIn) return null;

        const updated: Persona = {
            ...existing,
            ...data,
            updatedAt: Date.now(),
        };

        this.personas.set(id, updated);
        await this.saveCustomPersonas();
        this._eventBus?.emit(EVENTS.PERSONA_UPDATED, updated);
        LOGGER.info('PersonaService', 'Persona updated', { id });
        return updated;
    }

    /**
     * Delete custom persona
     */
    async delete(id: string): Promise<boolean> {
        const existing = this.personas.get(id);
        if (!existing || existing.isBuiltIn) return false;

        this.personas.delete(id);

        if (this.activePersonaId === id) {
            this.activePersonaId = null;
        }

        await this.saveCustomPersonas();
        this._eventBus?.emit(EVENTS.PERSONA_DELETED, { id });
        LOGGER.info('PersonaService', 'Persona deleted', { id });
        return true;
    }

    /**
     * Search personas by name/tags
     */
    search(query: string): Persona[] {
        const lower = query.toLowerCase();
        return this.getAll().filter(
            (p) =>
                p.name.toLowerCase().includes(lower) ||
                p.description.toLowerCase().includes(lower) ||
                p.tags.some((t) => t.toLowerCase().includes(lower)),
        );
    }

    /**
     * Get personas by tag
     */
    getByTag(tag: string): Persona[] {
        return this.getAll().filter((p) => p.tags.includes(tag));
    }

    /**
     * Get all unique tags
     */
    getAllTags(): string[] {
        const tags = new Set<string>();
        for (const p of this.personas.values()) {
            for (const t of p.tags) tags.add(t);
        }
        return Array.from(tags).sort();
    }

    /**
     * Suggest persona based on task description
     */
    suggestForTask(task: string): { persona: Persona; confidence: number }[] {
        const taskLower = task.toLowerCase();
        const scores: { persona: Persona; score: number }[] = [];

        for (const persona of this.personas.values()) {
            let score = 0;

            // Check description
            if (persona.description.toLowerCase().includes(taskLower.slice(0, 20))) score += 3;

            // Check tags
            for (const tag of persona.tags) {
                if (taskLower.includes(tag)) score += 2;
            }

            // Check system prompt keywords
            const keywords = this.extractKeywords(task);
            for (const kw of keywords) {
                if (persona.systemPrompt.toLowerCase().includes(kw)) score += 1;
            }

            if (score > 0) {
                scores.push({ persona, score });
            }
        }

        // Sort by score descending, normalize to confidence (0-1)
        scores.sort((a, b) => b.score - a.score);
        const maxScore = scores[0]?.score || 1;

        return scores.slice(0, 5).map((s) => ({
            persona: s.persona,
            confidence: Math.min(1, s.score / Math.max(maxScore, 3)),
        }));
    }

    private extractKeywords(text: string): string[] {
        // Simple keyword extraction
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 4);

        // Return top 5 most distinctive words
        return [...new Set(words)].slice(0, 5);
    }

    private async saveCustomPersonas(): Promise<void> {
        const custom = this.getAll()
            .filter((p) => !p.isBuiltIn)
            .map((p) => ({ id: p.id, persona: p }));

        if (this.db) {
            await this.db.setKv('customPersonas', custom);
        }
    }

    destroy() {
        this.personas.clear();
        this.activePersonaId = null;
        this.isInitialized = false;
    }
}

// Export tone presets for UI
export const TONE_PRESETS = Object.keys(TONE_PROMPTS) as TonePreset[];
