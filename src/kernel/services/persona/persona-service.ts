/**
 * PersonaService — Wave 4.2 (Distilly + TinyTroupe-inspired, offline-first).
 *
 * Distills Person/Voice profiles from user/expert samples with deterministic
 * heuristics (frequent phrases, sentence length, question rate, judgment
 * verbs); an LLM port can refine later. Deep persona (traits/beliefs/style)
 * renders as an AgentCard-compatible prompt block.
 */
import type { IEventBus } from '../../types/interfaces';
import type { PersonaRepository } from '../../dal/persona-repository';
import type { IPersonaLlmPort, IPersonaService } from '../../contracts/persona';
import type { PersonaDepth, PersonProfile, VoiceProfile } from '../../types/persona-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Persona');

function now(): number {
    return Date.now();
}

function topPhrases(samples: string[], limit = 8): string[] {
    const counts = new Map<string, number>();
    for (const s of samples) {
        const words = s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((w) => w.length > 3);
        for (let i = 0; i + 1 < words.length; i++) {
            const bi = `${words[i]} ${words[i + 1]}`;
            counts.set(bi, (counts.get(bi) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .filter(([, c]) => c >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([p]) => p);
}

const JUDGMENT_VERBS = [
    'prefer', 'avoid', 'always', 'never', 'must', 'should', 'prefer:', 'важно',
    'лучше', 'хуже', 'никогда', 'всегда', 'нужно', 'нельзя', 'предпочита',
];

function extractJudgments(samples: string[], limit = 6): string[] {
    const out: string[] = [];
    for (const s of samples) {
        const lower = s.toLowerCase();
        if (JUDGMENT_VERBS.some((v) => lower.includes(v))) {
            const first = s.split(/(?<=[.!?])\s+/u)[0] ?? s;
            if (first.trim().length > 0) out.push(first.trim().slice(0, 200));
        }
        if (out.length >= limit) break;
    }
    return out;
}

function styleNotesFor(samples: string[]): string[] {
    const notes: string[] = [];
    const lens = samples.map((s) => s.length);
    const avg = lens.length > 0 ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    notes.push(avg < 120 ? 'terse: short messages' : avg < 400 ? 'balanced length' : 'verbose: long messages');
    const q = samples.filter((s) => s.includes('?')).length;
    if (samples.length > 0 && q / samples.length > 0.3) notes.push('asks many questions');
    const bullets = samples.filter((s) => /^\s*[-*•\d]+[.)]/m.test(s)).length;
    if (samples.length > 0 && bullets / samples.length > 0.3) notes.push('prefers lists/bullets');
    const code = samples.filter((s) => s.includes('```') || /\b(fn|const|def|class)\b/.test(s)).length;
    if (code > 0) notes.push('uses code snippets');
    return notes;
}

export class PersonaService implements IPersonaService {
    constructor(
        private repo: PersonaRepository,
        private events: IEventBus,
        private llm?: IPersonaLlmPort,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Persona', 'init', {});
    }

    async destroy(): Promise<void> {
        // no background work
    }

    async distillPerson(input: {
        ownerId: string;
        displayName: string;
        samples: string[];
    }): Promise<PersonProfile> {
        const t = now();
        let styleNotes = styleNotesFor(input.samples);
        let judgments = extractJudgments(input.samples);
        if (this.llm && input.samples.length > 0) {
            try {
                const refined = await this.llm.distillStyle(input.samples.slice(0, 20));
                if (refined.styleNotes.length > 0) styleNotes = refined.styleNotes;
                if (refined.judgments.length > 0) judgments = refined.judgments;
            } catch (e) {
                LOGGER.warn('Persona', 'llm distill failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const existing = await this.repo.getPersonByOwner(input.ownerId);
        const profile: PersonProfile = {
            id: existing?.id ?? genId('person'),
            ownerId: input.ownerId,
            displayName: input.displayName,
            styleNotes,
            judgments,
            phrases: topPhrases(input.samples),
            sampleCount: (existing?.sampleCount ?? 0) + input.samples.length,
            createdAt: existing?.createdAt ?? t,
            updatedAt: t,
        };
        await this.repo.putPerson(profile);
        this.events.emit(EVENTS.PERSONA_DISTILLED, {
            personId: profile.id,
            ownerId: profile.ownerId,
            sampleCount: profile.sampleCount,
        });
        return profile;
    }

    async getPerson(ownerId: string): Promise<PersonProfile | null> {
        return this.repo.getPersonByOwner(ownerId);
    }

    async distillVoice(personId: string, samples: string[], tone = 'neutral'): Promise<VoiceProfile> {
        const t = now();
        const vocab = topPhrases(samples, 12);
        const existing = await this.repo.getVoice(personId);
        const voice: VoiceProfile = {
            id: existing?.id ?? genId('voice'),
            personId,
            tone,
            vocabulary: vocab,
            doNotUse: [],
            sampleCount: (existing?.sampleCount ?? 0) + samples.length,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putVoice(voice);
        return voice;
    }

    async getVoice(personId: string): Promise<VoiceProfile | null> {
        return this.repo.getVoice(personId);
    }

    async setDepth(input: {
        ownerId: string;
        traits?: Record<string, number>;
        beliefs?: string[];
        values?: string[];
        commStyle?: string;
        quirks?: string[];
    }): Promise<PersonaDepth> {
        const t = now();
        const existing = await this.repo.getDepth(input.ownerId);
        const depth: PersonaDepth = {
            id: existing?.id ?? genId('pdepth'),
            ownerId: input.ownerId,
            traits: input.traits ?? existing?.traits ?? {},
            beliefs: input.beliefs ?? existing?.beliefs ?? [],
            values: input.values ?? existing?.values,
            commStyle: input.commStyle ?? existing?.commStyle,
            quirks: input.quirks ?? existing?.quirks,
            createdAt: existing?.createdAt ?? t,
            updatedAt: t,
        };
        await this.repo.putDepth(depth);
        return depth;
    }

    async getDepth(ownerId: string): Promise<PersonaDepth | null> {
        return this.repo.getDepth(ownerId);
    }

    async promptFor(ownerId: string): Promise<string> {
        const [person, depth] = await Promise.all([
            this.repo.getPersonByOwner(ownerId),
            this.repo.getDepth(ownerId),
        ]);
        const parts: string[] = [];
        if (person) {
            parts.push(`[Person: ${person.displayName}]`);
            if (person.styleNotes.length > 0) parts.push(`Style: ${person.styleNotes.join('; ')}`);
            if (person.judgments.length > 0) parts.push(`Judgments: ${person.judgments.join(' | ')}`);
        }
        if (depth) {
            const traitStr = Object.entries(depth.traits)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            if (traitStr) parts.push(`Traits: ${traitStr}`);
            if (depth.beliefs.length > 0) parts.push(`Beliefs: ${depth.beliefs.join(' | ')}`);
            if (depth.commStyle) parts.push(`Communication: ${depth.commStyle}`);
        }
        return parts.join('\n');
    }
}
