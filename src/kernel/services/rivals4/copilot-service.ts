/**
 * CopilotService — I.1 (Copilot Studio-style topics, additive).
 *
 * Topics with trigger phrases (overlap match), closed-list/pattern entities,
 * per-conversation variables (kv), generative answers via RagService.
 * All definitions in DAL kv (`copilot/*`) — no schema change.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IRagService } from '../../contracts/rivals2';
import type { ICopilotService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Copilot');

interface TopicDoc {
    id: string;
    name: string;
    triggerPhrases: string[];
    reply?: string;
    entities: Array<{ name: string; kind: 'list' | 'pattern'; values: string[] }>;
}

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function overlap(a: string, b: string): number {
    const sa = tokens(a);
    if (sa.size === 0) return 0;
    const sb = tokens(b);
    let hit = 0;
    for (const t of sa) if (sb.has(t)) hit += 1;
    return hit / sa.size;
}

export class CopilotService implements ICopilotService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private rag?: IRagService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineTopic(input: { name: string; triggerPhrases: string[]; reply?: string }): Promise<string> {
        const doc: TopicDoc = {
            id: genId('topic'),
            name: input.name.slice(0, 120),
            triggerPhrases: input.triggerPhrases.map((p) => p.slice(0, 300)),
            reply: input.reply?.slice(0, 2000),
            entities: [],
        };
        await this.dal.kv.set(`copilot/${doc.id}`, doc);
        return doc.id;
    }

    async defineEntity(topicId: string, name: string, kind: 'list' | 'pattern', values: string[]): Promise<void> {
        const doc = await this.dal.kv.get<TopicDoc>(`copilot/${topicId}`);
        if (!doc) throw new Error(`Topic not found: ${topicId}`);
        if (kind === 'pattern') {
            for (const v of values) {
                try {
                    new RegExp(v);
                } catch {
                    throw new Error(`Invalid entity pattern: ${v}`);
                }
            }
        }
        doc.entities.push({ name, kind, values: values.slice(0, 50) });
        await this.dal.kv.set(`copilot/${topicId}`, doc);
    }

    async setVariable(conversationId: string, key: string, value: unknown): Promise<void> {
        const k = `copilot-vars/${conversationId}`;
        const vars = (await this.dal.kv.get<Record<string, unknown>>(k)) ?? {};
        vars[key.slice(0, 80)] = value;
        await this.dal.kv.set(k, vars);
    }

    async handleMessage(conversationId: string, text: string): Promise<string> {
        const rows = await this.dal.kv.list('copilot/');
        const topics = rows.map((r) => r.value as TopicDoc).filter((d) => Array.isArray(d.triggerPhrases));
        let best: TopicDoc | undefined;
        let bestScore = 0.25;
        for (const t of topics) {
            for (const phrase of t.triggerPhrases) {
                const s = overlap(text, phrase);
                if (s > bestScore) {
                    bestScore = s;
                    best = t;
                }
            }
        }
        this.events.emit(EVENTS.COPILOT_TOPIC, { topicId: best?.id ?? '', score: bestScore });
        if (!best) {
            // Generative answer fallback (Copilot Studio behavior).
            if (this.rag) {
                const res = await this.rag.answer(text, 0);
                return res.answer;
            }
            return "I don't have a topic for that yet. Try rephrasing.";
        }
        // Entity extraction into conversation variables.
        for (const ent of best.entities) {
            const found = this.extractEntity(text, ent.kind, ent.values);
            if (found) await this.setVariable(conversationId, ent.name, found);
        }
        if (best.reply) return this.fillVars(best.reply, await this.vars(conversationId));
        if (this.rag) {
            const res = await this.rag.answer(`${best.name}: ${text}`, 0);
            return res.answer;
        }
        return `Topic [${best.name}] matched.`;
    }

    private extractEntity(text: string, kind: 'list' | 'pattern', values: string[]): string | null {
        if (kind === 'list') {
            const lower = text.toLowerCase();
            for (const v of values) {
                if (lower.includes(v.toLowerCase())) return v;
            }
            return null;
        }
        for (const p of values) {
            const m = text.match(new RegExp(p, 'i'));
            if (m) return m[0];
        }
        return null;
    }

    private async vars(conversationId: string): Promise<Record<string, unknown>> {
        return (await this.dal.kv.get<Record<string, unknown>>(`copilot-vars/${conversationId}`)) ?? {};
    }

    private fillVars(template: string, vars: Record<string, unknown>): string {
        return template.replace(/\{(\w+)\}/g, (_, k: string) =>
            vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
        );
    }
}
