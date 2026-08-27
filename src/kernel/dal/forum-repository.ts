/**
 * ForumRepository — DAL wrapper for agent-forum persistence.
 *
 * Four Dexie tables:
 *   - forumTopics: topic headers (id, category, authorId, lastActivityAt, pinned, *tags)
 *   - forumPosts:  one row per post (id, topicId, authorId, createdAt, score, parentId)
 *   - forumVotes:  one row per (postId, voterId) — unique votes
 *   - forumSubs:   one row per (topicId, subscriberId)
 */
import type { DatabaseService } from '../services/database-service';
import type {
    ForumAuthor,
    ForumPostRecord,
    ForumSubRecord,
    ForumTopicRecord,
    ForumVoteRecord,
    PostId,
    TopicId,
} from '../types/forum-types';

export class ForumRepository {
    constructor(private db: DatabaseService) {}

    // ── Topics ────────────────────────────────────────────────────────────────

    async putTopic(topic: ForumTopicRecord): Promise<void> {
        await this.db.forumTopics.put(topic);
    }

    async getTopic(id: TopicId): Promise<ForumTopicRecord | undefined> {
        return this.db.forumTopics.get(id);
    }

    async listTopics(opts?: {
        category?: string;
        authorId?: string;
        status?: string;
        tag?: string;
        limit?: number;
    }): Promise<ForumTopicRecord[]> {
        let rows = await this.db.forumTopics.toArray();
        if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
        if (opts?.authorId) rows = rows.filter((r) => r.author.id === opts.authorId);
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        if (opts?.tag) rows = rows.filter((r) => r.tags.includes(opts.tag!));
        rows.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    async putPost(post: ForumPostRecord): Promise<void> {
        await this.db.forumPosts.put(post);
    }

    async getPost(id: PostId): Promise<ForumPostRecord | undefined> {
        return this.db.forumPosts.get(id);
    }

    async listPosts(
        topicId: TopicId,
        opts?: { sincePostId?: PostId; limit?: number },
    ): Promise<ForumPostRecord[]> {
        let rows = await this.db.forumPosts.where('topicId').equals(topicId).toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        if (opts?.sincePostId) {
            const since = rows.findIndex((r) => r.id === opts.sincePostId);
            if (since >= 0) rows = rows.slice(since + 1);
        }
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    async listPostsByAuthor(author: ForumAuthor): Promise<ForumPostRecord[]> {
        const rows = await this.db.forumPosts.where('authorId').equals(author.id).toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows;
    }

    // ── Votes ─────────────────────────────────────────────────────────────────

    async putVote(vote: ForumVoteRecord): Promise<void> {
        await this.db.forumVotes.put(vote);
    }

    async getVote(postId: PostId, voterId: string): Promise<ForumVoteRecord | undefined> {
        return this.db.forumVotes
            .where('[postId+voterId]')
            .equals([postId, voterId] as const)
            .first();
    }

    async deleteVote(postId: PostId, voterId: string): Promise<void> {
        await this.db.forumVotes
            .where('[postId+voterId]')
            .equals([postId, voterId] as const)
            .delete();
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    async putSub(sub: ForumSubRecord): Promise<void> {
        await this.db.forumSubs.put(sub);
    }

    async getSub(topicId: TopicId, subscriberId: string): Promise<ForumSubRecord | undefined> {
        return this.db.forumSubs
            .where('[topicId+subscriberId]')
            .equals([topicId, subscriberId] as const)
            .first();
    }

    async listSubs(topicId: TopicId): Promise<ForumSubRecord[]> {
        return this.db.forumSubs.where('topicId').equals(topicId).toArray();
    }

    // ── Maintenance ───────────────────────────────────────────────────────────

    async clear(): Promise<void> {
        await this.db.forumTopics.clear();
        await this.db.forumPosts.clear();
        await this.db.forumVotes.clear();
        await this.db.forumSubs.clear();
    }
}
