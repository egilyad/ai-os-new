/**
 * DialogueService — H.3 (Rasa-style intents/slots/stories, additive).
 *
 * Bots live in DAL kv (`bots/*`): intents with examples (overlap classify),
 * required slots with fill questions (slot-filling loop), stories as
 * scripted intent sequences. Sessions are ephemeral maps (last intent +
 * filled slots); every turn emits an event for analytics.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IDialogueService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Dialogue');

interface BotDoc {
    id: string;
    name: string;
    intents: Array<{ name: string; examples: string[] }>;
    slots: Array<{ name: string; question: string }>;
    stories: Array<{ name: string; path: string[] }>;
}

interface SessionState {
    lastIntent?: string;
    slots: Record<string, string>;
    story?: string;
    step: number;
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

export class DialogueService implements IDialogueService {
    private sessions = new Map<string, SessionState>();

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Dialogue', 'init', {});
    }

    async destroy(): Promise<void> {
        this.sessions.clear();
    }

    async createBot(input: {
        name: string;
        intents: Array<{ name: string; examples: string[] }>;
        slots?: Array<{ name: string; question: string }>;
    }): Promise<string> {
        if (input.intents.length === 0) throw new Error('Bot needs at least 1 intent');
        const doc: BotDoc = {
            id: genId('bot'),
            name: input.name.slice(0, 120),
            intents: input.intents.map((i) => ({ name: i.name, examples: [...i.examples] })),
            slots: (input.slots ?? []).map((s) => ({ ...s })),
            stories: [],
        };
        await this.dal.kv.set(`bots/${doc.id}`, doc);
        return doc.id;
    }

    async handleMessage(botId: string, sessionId: string, text: string): Promise<string> {
        const bot = await this.dal.kv.get<BotDoc>(`bots/${botId}`);
        if (!bot) throw new Error(`Bot not found: ${botId}`);
        const session = this.sessions.get(sessionId) ?? { slots: {}, step: 0 };

        // Slot-filling loop: a pending slot consumes the raw text.
        const pendingSlot = bot.slots.find((s) => !(s.name in session.slots));
        if (pendingSlot && session.lastIntent) {
            session.slots[pendingSlot.name] = text.slice(0, 300);
            const next = bot.slots.find((s) => !(s.name in session.slots));
            this.sessions.set(sessionId, session);
            this.events.emit(EVENTS.DIALOGUE_TURN, { botId, intent: session.lastIntent });
            if (next) return next.question;
            const filled = Object.entries(session.slots).map(([k, v]) => `${k}=${v}`).join(', ');
            session.slots = {};
            session.lastIntent = undefined;
            return `Got it (${filled}). How else can I help?`;
        }

        // NLU: best intent by example overlap.
        let best: { name: string; score: number } = { name: 'fallback', score: 0 };
        for (const intent of bot.intents) {
            for (const ex of intent.examples) {
                const s = overlap(text, ex);
                if (s > best.score) best = { name: intent.name, score: s };
            }
        }
        session.lastIntent = best.name;
        session.step += 1;
        // Story tracking: advance along a matching scripted path.
        const story = bot.stories.find((s) => s.path[session.step - 1] === best.name);
        if (story) session.story = story.name;
        this.sessions.set(sessionId, session);
        this.events.emit(EVENTS.DIALOGUE_TURN, { botId, intent: best.name });

        if (best.score < 0.2) {
            return `I didn't catch that. I understand: ${bot.intents.map((i) => i.name).join(', ')}.`;
        }
        const firstSlot = bot.slots[0];
        if (firstSlot && !(firstSlot.name in session.slots)) return firstSlot.question;
        return `Intent [${best.name}] handled${session.story ? ` (story: ${session.story})` : ''}.`;
    }
}
