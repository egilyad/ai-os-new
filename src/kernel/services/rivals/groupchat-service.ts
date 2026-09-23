/**
 * GroupChatService — F.2 (AutoGen-style group chat, additive).
 *
 * Members converse in rounds; the speaker is picked auto (least-recent),
 * round_robin, or manual. Turns run through ILLMClientService when present,
 * otherwise deterministic echo. Nested chats summarize into the parent.
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ILLMClientService, AdapterMessage } from '../../contracts/provider-adapter';
import type { IGroupChatService } from '../../contracts/rivals';
import type { ChatTurn, GroupChat, SpeakerSelection } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('GroupChat');

function now(): number {
    return Date.now();
}

export class GroupChatService implements IGroupChatService {
    constructor(
        private repo: RivalRepository,
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('GroupChat', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createChat(input: {
        name: string;
        members: string[];
        selection?: SpeakerSelection;
        maxRounds?: number;
        stopPhrases?: string[];
    }): Promise<GroupChat> {
        if (input.members.length < 2) throw new Error('Group chat needs at least 2 members');
        const t = now();
        const chat: GroupChat = {
            id: genId('gchat'),
            name: input.name,
            members: [...input.members],
            selection: input.selection ?? 'auto',
            maxRounds: input.maxRounds ?? 6,
            stopPhrases: input.stopPhrases ?? ['TERMINATE'],
            turns: [],
            status: 'running',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putChat(chat);
        this.events.emit(EVENTS.GROUPCHAT_CREATED, { chatId: chat.id, members: chat.members.length });
        return chat;
    }

    async postTurn(chatId: string, speaker: string, text: string): Promise<GroupChat> {
        const chat = await this.require(chatId);
        if (chat.status !== 'running') throw new Error(`Chat ${chatId} is ${chat.status}`);
        if (!chat.members.includes(speaker)) throw new Error(`Not a member: ${speaker}`);
        chat.turns.push({ speaker, text: text.slice(0, 4000), round: this.roundOf(chat), createdAt: now() });
        chat.updatedAt = now();
        if (chat.stopPhrases.some((p) => text.includes(p)) || this.roundOf(chat) >= chat.maxRounds) {
            chat.status = 'completed';
        }
        await this.repo.putChat(chat);
        this.events.emit(EVENTS.GROUPCHAT_TURN, { chatId, speaker });
        return chat;
    }

    async nextTurn(chatId: string, speaker?: string): Promise<ChatTurn> {
        const chat = await this.require(chatId);
        if (chat.status !== 'running') throw new Error(`Chat ${chatId} is ${chat.status}`);
        const who = speaker ?? this.pickSpeaker(chat);
        if (!chat.members.includes(who)) throw new Error(`Not a member: ${who}`);
        const history = chat.turns.slice(-10).map((t) => `[${t.speaker}]: ${t.text}`).join('\n');
        let text: string;
        if (this.llm) {
            try {
                const messages: AdapterMessage[] = [
                    {
                        role: 'system',
                        content: `You are ${who} in a group chat "${chat.name}" with ${chat.members.join(', ')}. Reply in 3 sentences or less. Say TERMINATE when the discussion is done.`,
                    },
                    { role: 'user', content: history ? `History:\n${history}` : 'Start the discussion.' },
                ];
                const res = await this.llm.chat(messages, {
                    temperature: 0.7,
                    maxTokens: 512,
                    cacheScope: { agentId: who, sessionId: chatId },
                });
                text = res.error ? `[${who}] (llm error, echo)` : res.content;
            } catch (e) {
                LOGGER.warn('GroupChat', 'groupchat llm failed', { error: e instanceof Error ? e.message : String(e) });
                text = `[${who}] acknowledges the discussion.`;
            }
        } else {
            text = `[${who}] acknowledges the discussion.`;
        }
        const turn: ChatTurn = { speaker: who, text: text.slice(0, 4000), round: this.roundOf(chat), createdAt: now() };
        chat.turns.push(turn);
        chat.updatedAt = now();
        if (chat.stopPhrases.some((p) => text.includes(p)) || this.roundOf(chat) >= chat.maxRounds) {
            chat.status = 'completed';
        }
        await this.repo.putChat(chat);
        this.events.emit(EVENTS.GROUPCHAT_TURN, { chatId, speaker: who });
        return turn;
    }

    async summarize(chatId: string): Promise<string> {
        const chat = await this.require(chatId);
        if (chat.turns.length === 0) return 'Empty chat.';
        const per: Record<string, number> = {};
        for (const t of chat.turns) per[t.speaker] = (per[t.speaker] ?? 0) + 1;
        const last = chat.turns[chat.turns.length - 1]!;
        return (
            `Chat "${chat.name}": ${chat.turns.length} turns, ` +
            Object.entries(per).map(([k, v]) => `${k}×${v}`).join(', ') +
            `. Last [${last.speaker}]: ${last.text.slice(0, 300)}`
        );
    }

    async nestChat(chatId: string, topic: string): Promise<GroupChat> {
        const parent = await this.require(chatId);
        const sub = await this.createChat({
            name: `${parent.name} / ${topic}`.slice(0, 160),
            members: parent.members,
            selection: parent.selection,
            maxRounds: 3,
            stopPhrases: parent.stopPhrases,
        });
        for (let i = 0; i < 2; i++) {
            await this.nextTurn(sub.id);
            const cur = await this.require(sub.id);
            if (cur.status !== 'running') break;
        }
        const summary = await this.summarize(sub.id);
        parent.turns.push({
            speaker: 'system',
            text: `[nested chat on "${topic}"]: ${summary}`.slice(0, 2000),
            round: this.roundOf(parent),
            createdAt: now(),
        });
        parent.updatedAt = now();
        await this.repo.putChat(parent);
        return parent;
    }

    async get(chatId: string): Promise<GroupChat | null> {
        return this.repo.getChat(chatId);
    }

    async listChats(): Promise<GroupChat[]> {
        return this.repo.listChats();
    }

    private pickSpeaker(chat: GroupChat): string {
        if (chat.selection === 'round_robin') {
            return chat.members[chat.turns.length % chat.members.length] as string;
        }
        // auto: least-recent speaker (fair rotation with continuity bias).
        const lastIdx = new Map<string, number>();
        chat.turns.forEach((t, i) => lastIdx.set(t.speaker, i));
        let best = chat.members[0] as string;
        let bestIdx = Infinity;
        for (const m of chat.members) {
            const idx = lastIdx.get(m) ?? -1;
            if (idx < bestIdx) {
                bestIdx = idx;
                best = m;
            }
        }
        return best;
    }

    private roundOf(chat: GroupChat): number {
        return Math.floor(chat.turns.length / Math.max(1, chat.members.length)) + 1;
    }

    private async require(id: string): Promise<GroupChat> {
        const c = await this.repo.getChat(id);
        if (!c) throw new Error(`Group chat not found: ${id}`);
        return c;
    }
}
