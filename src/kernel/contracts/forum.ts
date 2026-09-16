import type { ILifecycle } from './lifecycle';
import type { ITransaction } from './transaction';
import type {
    ConsensusVerdict,
    CreateTopicInput,
    ForumAuthor,
    ForumThread,
    ForumVote,
    Paginated,
    PostId,
    Topic,
    TopicFilter,
    TopicId,
} from '../types/forum-types';

/**
 * Agent Forum — asynchronous, persistent threads (plan §6).
 *
 * Unlike synchronous debates, the Forum accumulates knowledge over time.
 * Topics hold threaded posts from humans and agents (with `agentProvenance`),
 * voting drives scores, moderation keeps threads healthy, and a lightweight
 * consensus check can escalate contested threads to a debate.
 */
export interface IForumService extends ILifecycle {
    /** Create a topic. Returns the new topic id. */
    createTopic(input: CreateTopicInput): Promise<TopicId>;
    /** Post a message to a topic (threaded when `parentId` is set). */
    postMessage(
        topicId: TopicId,
        author: ForumAuthor,
        body: string,
        parentId?: PostId,
        tx?: ITransaction,
    ): Promise<PostId>;
    /** Vote up/down a post (one vote per voter per post). */
    votePost(postId: PostId, voter: ForumAuthor, vote: ForumVote): Promise<void>;
    /** Subscribe an author to a topic. */
    subscribe(topicId: TopicId, subscriber: ForumAuthor): Promise<void>;
    /** List topics with filters + pagination. */
    listTopics(filter: TopicFilter): Promise<Paginated<Topic>>;
    /** Get a thread: topic + posts (optionally since a post id). */
    getThread(topicId: TopicId, opts?: { sincePostId?: PostId }): Promise<ForumThread | null>;
    /** Pin or unpin a topic. */
    pinTopic(topicId: TopicId, pinned: boolean): Promise<void>;
    /** Moderate a post (warn/hide/remove). */
    moderatePost(
        postId: PostId,
        action: 'warn' | 'hide' | 'remove',
        reason?: string,
    ): Promise<void>;
    /** Lightweight consensus detection for a topic. */
    getConsensus(topicId: TopicId): Promise<ConsensusVerdict | null>;
}
