/**
 * Agent Channel service contract.
 *
 * Provides mIRC/Buzz-like channels where humans and AI agents communicate.
 * Supports threading, reactions, edit/delete, presence, typing, permissions.
 */
import type {
    Channel, ChannelId, ChannelMessage, CreateChannelInput,
    SendMessageInput, AgentId, AgentChannelEvent,
    TypingIndicator, AgentPresence, MessageId,
    RespondToMode, ChannelType, ChannelVisibility,
} from '../types/channel-types';

export interface IChannelService {
    // Channel CRUD
    createChannel(input: CreateChannelInput): Promise<Channel>;
    getChannel(id: ChannelId): Promise<Channel | undefined>;
    listChannels(type?: ChannelType, visibility?: ChannelVisibility): Promise<Channel[]>;
    archiveChannel(id: ChannelId): Promise<void>;
    updateTopic(channelId: ChannelId, topic: string): Promise<void>;

    // Members
    joinChannel(channelId: ChannelId, agentId: AgentId, displayName: string, role?: string, options?: {
        capabilities?: string[];
        systemPrompt?: string;
        model?: string;
        respondTo?: RespondToMode;
    }): Promise<void>;
    leaveChannel(channelId: ChannelId, agentId: AgentId): Promise<void>;
    getMembers(channelId: ChannelId): Promise<Channel['members']>;
    updateMemberPermissions(channelId: ChannelId, agentId: AgentId, options: {
        respondTo?: RespondToMode;
        respondToAllowlist?: AgentId[];
        systemPrompt?: string;
    }): Promise<void>;

    // Messages
    sendMessage(input: SendMessageInput): Promise<ChannelMessage>;
    getMessages(channelId: ChannelId, limit?: number, before?: number): Promise<ChannelMessage[]>;
    getMessage(id: string): Promise<ChannelMessage | undefined>;
    editMessage(messageId: MessageId, newContent: string, editorId: AgentId): Promise<ChannelMessage>;
    deleteMessage(messageId: MessageId, deleterId: AgentId): Promise<void>;

    // Threading
    getThread(rootMessageId: MessageId): Promise<ChannelMessage[]>;
    getReplyCount(messageId: MessageId): Promise<number>;

    // Reactions
    addReaction(messageId: MessageId, agentId: AgentId, emoji: string): Promise<void>;
    removeReaction(messageId: MessageId, agentId: AgentId, emoji: string): Promise<void>;

    // Agent dispatch — called when agent is @mentioned
    onMention(channelId: ChannelId, agentId: AgentId, message: ChannelMessage): Promise<void>;

    // Presence & typing
    setPresence(agentId: AgentId, status: AgentPresence['status']): Promise<void>;
    getPresence(channelId: ChannelId): Promise<AgentPresence[]>;
    setTyping(channelId: ChannelId, agentId: AgentId): Promise<void>;
    getTyping(channelId: ChannelId): Promise<TypingIndicator[]>;

    // Event stream
    getEvents(channelId: ChannelId, since?: number): Promise<AgentChannelEvent[]>;

    // History
    clearHistory(channelId: ChannelId): Promise<void>;

    // Search
    searchMessages(query: string, channelId?: ChannelId): Promise<ChannelMessage[]>;

    // Canvas
    updateCanvas(channelId: ChannelId, content: string): Promise<void>;
    getCanvas(channelId: ChannelId): Promise<string>;

    // Extension: register mention handlers
    registerMentionHandler(agentId: AgentId, handler: (channelId: ChannelId, message: ChannelMessage) => Promise<void>): void;
}
