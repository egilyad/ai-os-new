/**
 * ChannelService — mIRC/Buzz-like agent channels.
 *
 * Full implementation: channels, messages, threading, reactions, edit/delete,
 * presence, typing, permissions, search, canvas.
 */
import type { IChannelService } from '../contracts/channel';
import type { IEventBus } from '../types/interfaces';
import type {
    Channel, ChannelId, ChannelMessage, ChannelMember,
    CreateChannelInput, SendMessageInput, AgentId, AgentChannelEvent,
    TypingIndicator, AgentPresence, MessageId,
    RespondToMode, ChannelType, ChannelVisibility,
} from '../types/channel-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ChannelService');

let idCounter = 0;
function genId(prefix: string): string {
    return `${prefix}_${Date.now()}_${++idCounter}`;
}

const TYPING_TTL_MS = 5000;
const PRESENCE_TTL_MS = 180_000;

export class ChannelService implements IChannelService {
    private channels = new Map<ChannelId, Channel>();
    private messages = new Map<string, ChannelMessage>();
    private events = new Map<ChannelId, AgentChannelEvent[]>();
    private typing = new Map<string, TypingIndicator>();
    private presence = new Map<AgentId, AgentPresence>();
    private mentionHandlers = new Map<AgentId, (channelId: ChannelId, message: ChannelMessage) => Promise<void>>();

    constructor(private eventBus?: IEventBus) {}

    // ── Channel CRUD ──────────────────────────────────────────────────

    async createChannel(input: CreateChannelInput): Promise<Channel> {
        const id = genId('channel');
        const now = Date.now();
        const members: ChannelMember[] = (input.initialMembers || []).map((m) => ({
            agentId: m.agentId,
            displayName: m.displayName,
            role: (m.role as ChannelMember['role']) || 'bot',
            status: 'online' as const,
            capabilities: m.capabilities,
            systemPrompt: m.systemPrompt,
            model: m.model,
            respondTo: m.respondTo || 'all',
            respondToAllowlist: m.respondToAllowlist,
            joinedAt: now,
        }));

        const channel: Channel = {
            id,
            name: input.name,
            description: input.description,
            type: input.type || 'stream',
            visibility: input.visibility || 'public',
            status: 'active',
            members,
            createdAt: now,
            updatedAt: now,
        };

        this.channels.set(id, channel);
        this.events.set(id, []);

        const sysMsg = this.makeSystemMsg(id, `Channel "${input.name}" created. ${members.length} agent(s) joined.`);
        this.messages.set(sysMsg.id, sysMsg);

        this.emitEvent(id, { type: 'join', channelId: id, agentId: 'system', data: { name: input.name }, timestamp: now });
        this.eventBus?.emit('channel:created', { channelId: id, name: input.name });
        LOGGER.info('createChannel', `Created "${input.name}" (${id})`);
        return channel;
    }

    async getChannel(id: ChannelId): Promise<Channel | undefined> {
        return this.channels.get(id);
    }

    async listChannels(type?: ChannelType, visibility?: ChannelVisibility): Promise<Channel[]> {
        return Array.from(this.channels.values()).filter((c) => {
            if (c.status !== 'active') return false;
            if (type && c.type !== type) return false;
            if (visibility && c.visibility !== visibility) return false;
            return true;
        });
    }

    async archiveChannel(id: ChannelId): Promise<void> {
        const ch = this.channels.get(id);
        if (!ch) return;
        ch.status = 'archived';
        ch.updatedAt = Date.now();
        this.eventBus?.emit('channel:archived', { channelId: id });
    }

    async updateTopic(channelId: ChannelId, topic: string): Promise<void> {
        const ch = this.channels.get(channelId);
        if (!ch) return;
        ch.topic = topic;
        ch.updatedAt = Date.now();
    }

    // ── Members ───────────────────────────────────────────────────────

    async joinChannel(channelId: ChannelId, agentId: AgentId, displayName: string, role?: string, options?: {
        capabilities?: string[];
        systemPrompt?: string;
        model?: string;
        respondTo?: RespondToMode;
    }): Promise<void> {
        const ch = this.channels.get(channelId);
        if (!ch) return;
        if (ch.members.some((m) => m.agentId === agentId)) return;

        ch.members.push({
            agentId,
            displayName,
            role: (role as ChannelMember['role']) || 'bot',
            status: 'online',
            capabilities: options?.capabilities,
            systemPrompt: options?.systemPrompt,
            model: options?.model,
            respondTo: options?.respondTo || 'all',
            joinedAt: Date.now(),
        });
        ch.updatedAt = Date.now();

        this.messages.set(this.makeSystemMsg(channelId, `${displayName} joined the channel.`).id,
            this.makeSystemMsg(channelId, `${displayName} joined the channel.`));
        this.emitEvent(channelId, { type: 'join', channelId, agentId, data: { displayName }, timestamp: Date.now() });
        this.eventBus?.emit('channel:agent:joined', { channelId, agentId, displayName });
    }

    async leaveChannel(channelId: ChannelId, agentId: AgentId): Promise<void> {
        const ch = this.channels.get(channelId);
        if (!ch) return;
        const idx = ch.members.findIndex((m) => m.agentId === agentId);
        if (idx === -1) return;
        const member = ch.members[idx]!;
        ch.members.splice(idx, 1);
        ch.updatedAt = Date.now();

        this.messages.set(this.makeSystemMsg(channelId, `${member.displayName} left the channel.`).id,
            this.makeSystemMsg(channelId, `${member.displayName} left the channel.`));
        this.emitEvent(channelId, { type: 'leave', channelId, agentId, timestamp: Date.now() });
        this.eventBus?.emit('channel:agent:left', { channelId, agentId });
    }

    async getMembers(channelId: ChannelId): Promise<ChannelMember[]> {
        return this.channels.get(channelId)?.members || [];
    }

    async updateMemberPermissions(channelId: ChannelId, agentId: AgentId, options: {
        respondTo?: RespondToMode;
        respondToAllowlist?: AgentId[];
        systemPrompt?: string;
    }): Promise<void> {
        const ch = this.channels.get(channelId);
        if (!ch) return;
        const member = ch.members.find((m) => m.agentId === agentId);
        if (!member) return;
        if (options.respondTo) member.respondTo = options.respondTo;
        if (options.respondToAllowlist) member.respondToAllowlist = options.respondToAllowlist;
        if (options.systemPrompt) member.systemPrompt = options.systemPrompt;
        ch.updatedAt = Date.now();
    }

    // ── Messages ──────────────────────────────────────────────────────

    async sendMessage(input: SendMessageInput): Promise<ChannelMessage> {
        const threadRootId = input.replyTo
            ? (this.messages.get(input.replyTo)?.threadRootId || input.replyTo)
            : undefined;

        const msg: ChannelMessage = {
            id: genId('msg'),
            channelId: input.channelId,
            authorId: input.authorId,
            kind: input.kind || 'text',
            content: input.content,
            mentions: input.mentions,
            replyTo: input.replyTo,
            threadRootId,
            replyCount: 0,
            reactions: [],
            isDeleted: false,
            createdAt: Date.now(),
        };

        this.messages.set(msg.id, msg);

        // Update reply count on parent
        if (input.replyTo) {
            const parent = this.messages.get(input.replyTo);
            if (parent) parent.replyCount++;
        }

        this.emitEvent(input.channelId, {
            type: 'message', channelId: input.channelId, agentId: input.authorId,
            data: { messageId: msg.id, kind: msg.kind, content: msg.content.slice(0, 100) },
            timestamp: msg.createdAt,
        });
        this.eventBus?.emit('channel:message', {
            channelId: input.channelId, messageId: msg.id, authorId: input.authorId,
            kind: msg.kind, content: msg.content.slice(0, 200), mentions: msg.mentions,
        });

        if (input.mentions && input.mentions.length > 0) {
            for (const mentionedId of input.mentions) {
                await this.onMention(input.channelId, mentionedId, msg);
            }
        }

        const ch = this.channels.get(input.channelId);
        if (ch) ch.updatedAt = Date.now();
        return msg;
    }

    async getMessages(channelId: ChannelId, limit = 50, before?: number): Promise<ChannelMessage[]> {
        const all = Array.from(this.messages.values())
            .filter((m) => m.channelId === channelId && !m.isDeleted)
            .sort((a, b) => a.createdAt - b.createdAt);
        const filtered = before ? all.filter((m) => m.createdAt < before) : all;
        return filtered.slice(-limit);
    }

    async getMessage(id: string): Promise<ChannelMessage | undefined> {
        return this.messages.get(id);
    }

    async editMessage(messageId: MessageId, newContent: string, editorId: AgentId): Promise<ChannelMessage> {
        const msg = this.messages.get(messageId);
        if (!msg) throw new Error(`Message ${messageId} not found`);
        if (msg.authorId !== editorId) throw new Error('Only the author can edit');
        msg.editedContent = newContent;
        msg.updatedAt = Date.now();

        this.emitEvent(msg.channelId, {
            type: 'edit', channelId: msg.channelId, agentId: editorId,
            data: { messageId }, timestamp: Date.now(),
        });
        return msg;
    }

    async deleteMessage(messageId: MessageId, deleterId: AgentId): Promise<void> {
        const msg = this.messages.get(messageId);
        if (!msg) return;
        msg.isDeleted = true;
        msg.updatedAt = Date.now();

        this.emitEvent(msg.channelId, {
            type: 'delete', channelId: msg.channelId, agentId: deleterId,
            data: { messageId }, timestamp: Date.now(),
        });
    }

    // ── Threading ─────────────────────────────────────────────────────

    async getThread(rootMessageId: MessageId): Promise<ChannelMessage[]> {
        const root = this.messages.get(rootMessageId);
        if (!root) return [];
        return Array.from(this.messages.values())
            .filter((m) => m.threadRootId === rootMessageId || m.id === rootMessageId)
            .sort((a, b) => a.createdAt - b.createdAt);
    }

    async getReplyCount(messageId: MessageId): Promise<number> {
        return this.messages.get(messageId)?.replyCount || 0;
    }

    // ── Reactions ─────────────────────────────────────────────────────

    async addReaction(messageId: MessageId, agentId: AgentId, emoji: string): Promise<void> {
        const msg = this.messages.get(messageId);
        if (!msg) return;
        if (msg.reactions.some((r) => r.agentId === agentId && r.emoji === emoji)) return;
        msg.reactions.push({ emoji, agentId, createdAt: Date.now() });
        this.emitEvent(msg.channelId, {
            type: 'reaction', channelId: msg.channelId, agentId,
            data: { messageId, emoji, action: 'add' }, timestamp: Date.now(),
        });
    }

    async removeReaction(messageId: MessageId, agentId: AgentId, emoji: string): Promise<void> {
        const msg = this.messages.get(messageId);
        if (!msg) return;
        msg.reactions = msg.reactions.filter((r) => !(r.agentId === agentId && r.emoji === emoji));
    }

    // ── Mention dispatch ──────────────────────────────────────────────

    async onMention(channelId: ChannelId, agentId: AgentId, message: ChannelMessage): Promise<void> {
        const ch = this.channels.get(channelId);
        if (!ch) return;
        const member = ch.members.find((m) => m.agentId === agentId);
        if (!member) return;

        // Check respondTo permissions
        if (member.respondTo === 'owner-only') {
            const owner = ch.members.find((m) => m.role === 'owner');
            if (owner && message.authorId !== owner.agentId) {
                LOGGER.info('onMention', `Blocked mention to ${agentId}: owner-only mode`);
                return;
            }
        } else if (member.respondTo === 'allowlist') {
            if (!member.respondToAllowlist?.includes(message.authorId)) {
                LOGGER.info('onMention', `Blocked mention to ${agentId}: not in allowlist`);
                return;
            }
        }

        const handler = this.mentionHandlers.get(agentId);
        if (handler) {
            try {
                await handler(channelId, message);
            } catch (e) {
                LOGGER.error('onMention', `Handler error for ${agentId}: ${e}`);
            }
        }
    }

    // ── Presence & typing ─────────────────────────────────────────────

    async setPresence(agentId: AgentId, status: AgentPresence['status']): Promise<void> {
        this.presence.set(agentId, { agentId, status, lastSeenAt: Date.now() });
    }

    async getPresence(channelId: ChannelId): Promise<AgentPresence[]> {
        const ch = this.channels.get(channelId);
        if (!ch) return [];
        const now = Date.now();
        return ch.members
            .map((m) => this.presence.get(m.agentId))
            .filter((p): p is AgentPresence => !!p && (now - p.lastSeenAt) < PRESENCE_TTL_MS);
    }

    async setTyping(channelId: ChannelId, agentId: AgentId): Promise<void> {
        this.typing.set(`${channelId}:${agentId}`, { channelId, agentId, startedAt: Date.now() });
    }

    async getTyping(channelId: ChannelId): Promise<TypingIndicator[]> {
        const now = Date.now();
        const result: TypingIndicator[] = [];
        for (const [key, indicator] of this.typing) {
            if (key.startsWith(`${channelId}:`) && (now - indicator.startedAt) < TYPING_TTL_MS) {
                result.push(indicator);
            }
        }
        return result;
    }

    // ── Events ────────────────────────────────────────────────────────

    async getEvents(channelId: ChannelId, since?: number): Promise<AgentChannelEvent[]> {
        const events = this.events.get(channelId) || [];
        return since ? events.filter((e) => e.timestamp > since) : events;
    }

    // ── History ───────────────────────────────────────────────────────

    async clearHistory(channelId: ChannelId): Promise<void> {
        for (const [id, msg] of this.messages) {
            if (msg.channelId === channelId) this.messages.delete(id);
        }
        this.events.set(channelId, []);
    }

    // ── Search ────────────────────────────────────────────────────────

    async searchMessages(query: string, channelId?: ChannelId): Promise<ChannelMessage[]> {
        const q = query.toLowerCase();
        return Array.from(this.messages.values())
            .filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q))
            .filter((m) => !channelId || m.channelId === channelId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);
    }

    // ── Canvas ────────────────────────────────────────────────────────

    async updateCanvas(channelId: ChannelId, content: string): Promise<void> {
        const ch = this.channels.get(channelId);
        if (ch) {
            ch.canvasContent = content;
            ch.updatedAt = Date.now();
        }
    }

    async getCanvas(channelId: ChannelId): Promise<string> {
        return this.channels.get(channelId)?.canvasContent || '';
    }

    // ── Extension ─────────────────────────────────────────────────────

    registerMentionHandler(agentId: AgentId, handler: (channelId: ChannelId, message: ChannelMessage) => Promise<void>): void {
        this.mentionHandlers.set(agentId, handler);
    }

    // ── Private ───────────────────────────────────────────────────────

    private makeSystemMsg(channelId: ChannelId, content: string): ChannelMessage {
        const msg: ChannelMessage = {
            id: genId('msg'),
            channelId,
            authorId: 'system',
            kind: 'system',
            content,
            replyCount: 0,
            reactions: [],
            isDeleted: false,
            createdAt: Date.now(),
        };
        this.messages.set(msg.id, msg);
        return msg;
    }

    private emitEvent(channelId: ChannelId, event: AgentChannelEvent): void {
        const list = this.events.get(channelId);
        if (list) {
            list.push(event);
            if (list.length > 500) list.splice(0, list.length - 500);
        }
    }
}
