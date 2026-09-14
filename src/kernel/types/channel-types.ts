/**
 * Agent Channel types — mIRC-like channels where humans and AI agents communicate.
 *
 * Modeled after Block's Buzz: channels with threading, permissions, presence,
 * reactions, and agent personas.
 */

export type ChannelId = string;
export type MessageId = string;
export type AgentId = string;

export type ChannelStatus = 'active' | 'archived';
export type ChannelType = 'stream' | 'forum' | 'dm';
export type ChannelVisibility = 'public' | 'private';
export type MessageKind = 'text' | 'code' | 'system' | 'action' | 'edit' | 'delete';
export type AgentRole = 'owner' | 'admin' | 'member' | 'bot' | 'guest';
export type AgentStatus = 'online' | 'away' | 'offline' | 'busy';
export type RespondToMode = 'owner-only' | 'allowlist' | 'all';

export interface ChannelMember {
    agentId: AgentId;
    displayName: string;
    role: AgentRole;
    status: AgentStatus;
    avatarUrl?: string;
    capabilities?: string[];
    systemPrompt?: string;
    model?: string;
    respondTo: RespondToMode;
    respondToAllowlist?: AgentId[];
    joinedAt: number;
    lastActiveAt?: number;
    lastPresenceAt?: number;
}

export interface Reaction {
    emoji: string;
    agentId: AgentId;
    createdAt: number;
}

export interface ChannelMessage {
    id: MessageId;
    channelId: ChannelId;
    authorId: AgentId;
    kind: MessageKind;
    content: string;
    editedContent?: string;
    mentions?: AgentId[];
    replyTo?: MessageId;
    threadRootId?: MessageId;
    replyCount: number;
    reactions: Reaction[];
    isDeleted: boolean;
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt?: number;
}

export interface Channel {
    id: ChannelId;
    name: string;
    description?: string;
    type: ChannelType;
    visibility: ChannelVisibility;
    status: ChannelStatus;
    topic?: string;
    members: ChannelMember[];
    pinnedMessageIds?: MessageId[];
    canvasContent?: string;
    createdAt: number;
    updatedAt: number;
    metadata?: Record<string, unknown>;
}

export interface CreateChannelInput {
    name: string;
    description?: string;
    type?: ChannelType;
    visibility?: ChannelVisibility;
    initialMembers?: Array<{
        agentId: string;
        displayName: string;
        role?: AgentRole;
        capabilities?: string[];
        systemPrompt?: string;
        model?: string;
        respondTo?: RespondToMode;
        respondToAllowlist?: AgentId[];
    }>;
}

export interface SendMessageInput {
    channelId: ChannelId;
    authorId: AgentId;
    kind?: MessageKind;
    content: string;
    mentions?: AgentId[];
    replyTo?: MessageId;
}

export interface AgentChannelEvent {
    type: 'message' | 'join' | 'leave' | 'typing' | 'status' | 'reaction' | 'edit' | 'delete';
    channelId: ChannelId;
    agentId: AgentId;
    data?: Record<string, unknown>;
    timestamp: number;
}

export interface TypingIndicator {
    channelId: ChannelId;
    agentId: AgentId;
    startedAt: number;
}

export interface AgentPresence {
    agentId: AgentId;
    status: AgentStatus;
    lastSeenAt: number;
}
