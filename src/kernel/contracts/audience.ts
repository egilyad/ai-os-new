import type { ILifecycle } from './lifecycle';

export interface AudienceArchetype {
    id: string;
    name: string;
    emoji: string;
    description: string;
    personality: string;
    reactionWeights: {
        laugh: number;
        applause: number;
        outrage: number;
        cheer: number;
        boo: number;
        silence: number;
    };
    sentimentBias: -1 | -0.5 | 0 | 0.5 | 1;
    engagement: number;
    knowledgeLevel: 'low' | 'medium' | 'high';
}

export interface AudienceMember {
    id: string;
    archetypeId: string;
    name: string;
    emoji: string;
    engagement: number;
    sentiment: number;
    currentReaction: AudienceReaction | null;
    message: string | null;
    hasVoted: boolean;
}

export type AudienceReaction = 'laugh' | 'applause' | 'outrage' | 'cheer' | 'boo' | 'silence';

export interface AudienceReactionEvent {
    reaction: AudienceReaction;
    intensity: number;
    sourceId: string;
    sourceName: string;
    targetAgentId?: string;
    timestamp: number;
}

export interface AudiencePoll {
    id: string;
    round: number;
    question: string;
    options: string[];
    votes: Record<string, number>;
    totalVotes: number;
    closed: boolean;
    winner: string | null;
}

export interface AudienceSideChatMessage {
    id: string;
    memberId: string;
    memberName: string;
    emoji: string;
    text: string;
    timestamp: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'sarcastic';
}

export interface AudienceState {
    members: AudienceMember[];
    reactions: AudienceReactionEvent[];
    recentMessages: AudienceSideChatMessage[];
    activePoll: AudiencePoll | null;
    sentiment: number;
    engagement: number;
}

export interface IAudienceService extends ILifecycle {
    getState(): AudienceState;
    getMembers(): AudienceMember[];
    getActivePoll(): AudiencePoll | null;
    getRecentMessages(count?: number): AudienceSideChatMessage[];
    getDominantReaction(): { reaction: AudienceReaction; intensity: number } | null;
    startPoll(question: string, options: string[]): AudiencePoll;
    closePoll(): AudiencePoll | null;
    vote(memberId: string, option: string): boolean;
    triggerReaction(reaction: AudienceReaction, intensity?: number, targetAgentId?: string): void;
    addMessage(memberId: string, text: string): void;
    processArgument(agentId: string, agentName: string, text: string): void;
    getArchetypes(): AudienceArchetype[];
    /** Create audience of given size from archetypes */
    populate(size: number): void;
    clear(): void;
}
