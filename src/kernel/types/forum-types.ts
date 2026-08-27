/**
 * Agent Forum domain types.
 *
 * The Forum is an asynchronous, persistent discussion space — a "laboratory +
 * library + café" where agents and humans accumulate knowledge (unlike
 * synchronous debates). Posts carry optional `agentProvenance` so agent
 * contributions are transparent about their origin (plan §6).
 */

export type ForumAuthorKind = 'human' | 'agent';

export interface ForumAuthor {
    kind: ForumAuthorKind;
    id: string;
    roleId?: string;
    displayName: string;
}

export type ForumVote = 'up' | 'down';

export interface VoteRecord {
    voter: ForumAuthor;
    vote: ForumVote;
    createdAt: number;
}

export interface AgentProvenance {
    /** Trace id of the generating execution, when available. */
    traceId?: string;
    modelId?: string;
    roleId?: string;
    tokensCost: number;
}

export type ModerationAction = 'none' | 'warn' | 'hide' | 'remove';

export interface ModerationState {
    status: 'normal' | 'hidden' | 'removed';
    action: ModerationAction;
    reason?: string;
    moderatedBy?: ForumAuthor;
    at?: number;
}

export interface Post {
    id: PostId;
    topicId: TopicId;
    author: ForumAuthor;
    body: string;
    renderedHtml: string;
    parentId?: string;
    createdAt: number;
    editedAt?: number;
    score: number;
    votes: VoteRecord[];
    agentProvenance?: AgentProvenance;
    moderation: ModerationState;
}

export type PostId = string;

export type TopicStatus = 'open' | 'closed' | 'archived';

export interface Topic {
    id: TopicId;
    title: string;
    category: string;
    author: ForumAuthor;
    tags: string[];
    pinned: boolean;
    status: TopicStatus;
    /** Aggregate vote score across posts. */
    score: number;
    postCount: number;
    createdAt: number;
    lastActivityAt: number;
}

export type TopicId = string;

export interface CreateTopicInput {
    title: string;
    category: string;
    author: ForumAuthor;
    tags?: string[];
    body?: string;
    pinned?: boolean;
}

export interface TopicFilter {
    category?: string;
    authorId?: string;
    status?: TopicStatus;
    tag?: string;
    /** 0-based page index. */
    page?: number;
    pageSize?: number;
}

export interface Paginated<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
}

export interface ForumThread {
    topic: Topic;
    posts: Post[];
}

/** Lightweight consensus verdict for a thread (drives debate escalation). */
export interface ConsensusVerdict {
    status: 'open' | 'consensus' | 'contested';
    confidence: number;
    summary: string;
}

// ── Persistence records ───────────────────────────────────────────────────────

export interface ForumTopicRecord {
    id: TopicId;
    title: string;
    category: string;
    author: ForumAuthor;
    tags: string[];
    pinned: boolean;
    status: TopicStatus;
    score: number;
    postCount: number;
    createdAt: number;
    lastActivityAt: number;
    /** Full topic object for round-trip reads. */
    topic?: Topic;
}

export interface ForumPostRecord {
    id: PostId;
    topicId: TopicId;
    author: ForumAuthor;
    body: string;
    renderedHtml: string;
    parentId?: string;
    createdAt: number;
    editedAt?: number;
    score: number;
    votes: VoteRecord[];
    agentProvenance?: AgentProvenance;
    moderation: ModerationState;
    /** Full post object for round-trip reads. */
    post?: Post;
}

export interface ForumVoteRecord {
    id: string;
    postId: PostId;
    voterId: string;
    vote: ForumVote;
    createdAt: number;
}

export interface ForumSubRecord {
    id: string;
    topicId: TopicId;
    subscriberId: string;
    createdAt: number;
}
