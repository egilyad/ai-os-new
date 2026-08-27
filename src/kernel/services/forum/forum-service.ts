import type { IForumService } from '../../contracts/forum';
import type { ITransaction } from '../../contracts/transaction';
import type { ForumRepository } from '../../dal/forum-repository';
import type { IEventBus } from '../../types/interfaces';
import type {
    ConsensusVerdict,
    CreateTopicInput,
    ForumAuthor,
    ForumPostRecord,
    ForumThread,
    ForumTopicRecord,
    ForumVote,
    ForumVoteRecord,
    Paginated,
    Post,
    PostId,
    Topic,
    TopicFilter,
    TopicId,
} from '../../types/forum-types';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';

const DEFAULT_LIMITS = {
    maxPostsPerMinute: 10,
};

/**
 * Agent Forum — async persistent threads orchestrator (plan §6).
 *
 * Topics hold threaded posts from humans and agents. Votes drive scores,
 * moderation keeps threads healthy, a lightweight consensus check reports
 * thread status, and anti-flood budgeting limits posts per author.
 * Deterministic heuristics keep the pipeline unit-testable; production
 * wiring can swap rendering/consensus for real model calls.
 */
export class ForumService implements IForumService {
    private _initialized = false;
    private limits = { ...DEFAULT_LIMITS };

    constructor(
        private deps: {
            repository: ForumRepository;
            eventBus: IEventBus;
            limits?: Partial<typeof DEFAULT_LIMITS>;
        },
    ) {
        if (deps.limits) this.limits = { ...this.limits, ...deps.limits };
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
    }

    async destroy(): Promise<void> {
        this._initialized = false;
    }

    async createTopic(input: CreateTopicInput): Promise<TopicId> {
        const title = input.title?.trim();
        if (!title) throw new Error('Forum: topic title is required');

        const id = genId('topic');
        const now = Date.now();
        const topic: Topic = {
            id,
            title,
            category: input.category?.trim() || 'general',
            author: input.author,
            tags: input.tags ?? [],
            pinned: input.pinned ?? false,
            status: 'open',
            score: 0,
            postCount: 0,
            createdAt: now,
            lastActivityAt: now,
        };
        await this.saveTopic(topic);
        this.deps.eventBus.emit(EVENTS.FORUM_TOPIC_CREATED, {
            topicId: id,
            title,
            category: topic.category,
            authorId: input.author.id,
        });

        if (input.body?.trim()) {
            await this.postMessage(id, input.author, input.body);
        }
        return id;
    }

    async postMessage(
        topicId: TopicId,
        author: ForumAuthor,
        body: string,
        parentId?: PostId,
        _tx?: ITransaction,
    ): Promise<PostId> {
        const text = body?.trim();
        if (!text) throw new Error('Forum: post body is required');

        const topicRec = await this.deps.repository.getTopic(topicId);
        if (!topicRec) throw new Error(`Forum: topic ${topicId} not found`);
        if (topicRec.status === 'closed' || topicRec.status === 'archived') {
            throw new Error(`Forum: topic ${topicId} is ${topicRec.status}`);
        }

        await this.enforceFloodBudget(author, topicId);

        const id = genId('post');
        const now = Date.now();
        const post: Post = {
            id,
            topicId,
            author,
            body: text,
            renderedHtml: this.renderBody(text),
            parentId: parentId ?? undefined,
            createdAt: now,
            score: 0,
            votes: [],
            agentProvenance:
                author.kind === 'agent'
                    ? {
                          traceId: genId('trace'),
                          modelId: `model-${author.roleId ?? 'generic'}`,
                          roleId: author.roleId,
                          tokensCost: 40 + Math.ceil(text.length / 4),
                      }
                    : undefined,
            moderation: { status: 'normal', action: 'none' },
        };

        const topic = this.toTopic(topicRec);
        topic.postCount += 1;
        topic.lastActivityAt = now;

        await this.deps.repository.putPost(this.toPostRecord(post));
        await this.saveTopic(topic);

        this.deps.eventBus.emit(EVENTS.FORUM_POST_ADDED, {
            postId: id,
            topicId,
            authorId: author.id,
        });

        return id;
    }

    async votePost(postId: PostId, voter: ForumAuthor, vote: ForumVote): Promise<void> {
        const postRec = await this.deps.repository.getPost(postId);
        if (!postRec) throw new Error(`Forum: post ${postId} not found`);

        const existing = await this.deps.repository.getVote(postId, voter.id);
        if (existing && existing.vote === vote) return; // idempotent

        const post = this.toPost(postRec);
        const delta = existing
            ? (vote === 'up' ? 1 : -1) - (existing.vote === 'up' ? 1 : -1)
            : vote === 'up'
              ? 1
              : -1;

        // Remove old vote record, add the new one.
        if (existing) await this.deps.repository.deleteVote(postId, voter.id);
        const voteRecord: ForumVoteRecord = {
            id: `${postId}:${voter.id}`,
            postId,
            voterId: voter.id,
            vote,
            createdAt: Date.now(),
        };
        await this.deps.repository.putVote(voteRecord);

        post.score += delta;
        post.votes = post.votes.filter((v) => v.voter.id !== voter.id);
        post.votes.push({ voter, vote, createdAt: voteRecord.createdAt });
        await this.deps.repository.putPost(this.toPostRecord(post));

        // Aggregate score up to the topic.
        const topicRec = await this.deps.repository.getTopic(post.topicId);
        if (topicRec) {
            const topic = this.toTopic(topicRec);
            topic.score += delta;
            await this.saveTopic(topic);
        }

        this.deps.eventBus.emit(EVENTS.FORUM_POST_VOTED, {
            postId,
            topicId: post.topicId,
            voterId: voter.id,
            vote,
        });
    }

    async subscribe(topicId: TopicId, subscriber: ForumAuthor): Promise<void> {
        const topicRec = await this.deps.repository.getTopic(topicId);
        if (!topicRec) throw new Error(`Forum: topic ${topicId} not found`);
        const id = `${topicId}:${subscriber.id}`;
        const existing = await this.deps.repository.getSub(topicId, subscriber.id);
        if (existing) return;
        await this.deps.repository.putSub({
            id,
            topicId,
            subscriberId: subscriber.id,
            createdAt: Date.now(),
        });
    }

    async listTopics(filter: TopicFilter): Promise<Paginated<Topic>> {
        const page = filter.page ?? 0;
        const pageSize = filter.pageSize ?? 20;
        const all = await this.deps.repository.listTopics({
            category: filter.category,
            authorId: filter.authorId,
            status: filter.status,
            tag: filter.tag,
        });
        const start = page * pageSize;
        const items = all.slice(start, start + pageSize).map((r) => this.toTopic(r));
        return { items, page, pageSize, total: all.length };
    }

    async getThread(
        topicId: TopicId,
        opts?: { sincePostId?: PostId },
    ): Promise<ForumThread | null> {
        const topicRec = await this.deps.repository.getTopic(topicId);
        if (!topicRec) return null;
        const posts = (
            await this.deps.repository.listPosts(topicId, { sincePostId: opts?.sincePostId })
        )
            .filter((r) => r.moderation.status !== 'removed')
            .map((r) => this.toPost(r));
        return { topic: this.toTopic(topicRec), posts };
    }

    async pinTopic(topicId: TopicId, pinned: boolean): Promise<void> {
        const topicRec = await this.deps.repository.getTopic(topicId);
        if (!topicRec) throw new Error(`Forum: topic ${topicId} not found`);
        const topic = this.toTopic(topicRec);
        topic.pinned = pinned;
        await this.saveTopic(topic);
    }

    async moderatePost(
        postId: PostId,
        action: 'warn' | 'hide' | 'remove',
        reason?: string,
    ): Promise<void> {
        const postRec = await this.deps.repository.getPost(postId);
        if (!postRec) throw new Error(`Forum: post ${postId} not found`);
        const post = this.toPost(postRec);
        post.moderation = {
            status: action === 'hide' ? 'hidden' : action === 'remove' ? 'removed' : 'normal',
            action,
            reason,
            at: Date.now(),
        };
        await this.deps.repository.putPost(this.toPostRecord(post));
    }

    async getConsensus(topicId: TopicId): Promise<ConsensusVerdict | null> {
        const topicRec = await this.deps.repository.getTopic(topicId);
        if (!topicRec) return null;
        const posts = (await this.deps.repository.listPosts(topicId)).map((r) => this.toPost(r));

        if (posts.length < 3) {
            return {
                status: 'open',
                confidence: 0.2,
                summary: 'Мало постов для оценки консенсуса.',
            };
        }

        const authors = new Set(posts.map((p) => p.author.id));
        const up = posts.reduce((s, p) => s + p.votes.filter((v) => v.vote === 'up').length, 0);
        const down = posts.reduce((s, p) => s + p.votes.filter((v) => v.vote === 'down').length, 0);
        const diversity = authors.size;

        // Normalize vote balance to [-1, 1].
        const balance = up + down === 0 ? 0 : (up - down) / (up + down);
        const activity = posts.length;
        const confidence = Math.round(
            Math.min(
                0.9,
                Math.max(
                    0.2,
                    0.35 * Math.abs(balance) +
                        0.25 * Math.min(1, activity / 12) +
                        0.2 * Math.min(1, diversity / 4),
                ),
            ),
        );

        let status: ConsensusVerdict['status'];
        let summary: string;
        if (diversity >= 2 && balance > 0.35) {
            status = 'consensus';
            summary = `Консенсус между ${diversity} участниками, баланс голосов +${(balance * 100).toFixed(0)}%.`;
        } else if (diversity >= 2 && Math.abs(balance) < 0.25 && activity >= 5) {
            status = 'contested';
            summary = `Позиции расходятся (${activity} постов, ${diversity} участников) — требуется дебат.`;
        } else {
            status = 'open';
            summary = 'Дискуссия продолжается, консенсус ещё не сформирован.';
        }
        return { status, confidence, summary };
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private async enforceFloodBudget(author: ForumAuthor, topicId: TopicId): Promise<void> {
        const windowMs = 60_000;
        const cutoff = Date.now() - windowMs;
        const recent = (await this.deps.repository.listPosts(topicId)).filter(
            (r) => r.author.id === author.id && r.createdAt >= cutoff,
        );
        if (recent.length >= this.limits.maxPostsPerMinute) {
            throw new Error(
                `Forum: flood budget exceeded (${this.limits.maxPostsPerMinute} posts/min per author)`,
            );
        }
    }

    private renderBody(text: string): string {
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return escaped
            .replace(
                /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener">$1</a>',
            )
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br/>');
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private toTopic(record: ForumTopicRecord): Topic {
        return {
            id: record.id,
            title: record.title,
            category: record.category,
            author: record.author,
            tags: record.tags,
            pinned: record.pinned,
            status: record.status,
            score: record.score,
            postCount: record.postCount,
            createdAt: record.createdAt,
            lastActivityAt: record.lastActivityAt,
        };
    }

    private toPost(record: ForumPostRecord): Post {
        return {
            id: record.id,
            topicId: record.topicId,
            author: record.author,
            body: record.body,
            renderedHtml: record.renderedHtml,
            parentId: record.parentId,
            createdAt: record.createdAt,
            editedAt: record.editedAt,
            score: record.score,
            votes: record.votes,
            agentProvenance: record.agentProvenance,
            moderation: record.moderation,
        };
    }

    private async saveTopic(topic: Topic): Promise<void> {
        await this.deps.repository.putTopic({
            id: topic.id,
            title: topic.title,
            category: topic.category,
            author: topic.author,
            tags: topic.tags,
            pinned: topic.pinned,
            status: topic.status,
            score: topic.score,
            postCount: topic.postCount,
            createdAt: topic.createdAt,
            lastActivityAt: topic.lastActivityAt,
            topic,
        });
    }

    private toPostRecord(post: Post): ForumPostRecord {
        return {
            id: post.id,
            topicId: post.topicId,
            author: post.author,
            body: post.body,
            renderedHtml: post.renderedHtml,
            parentId: post.parentId,
            createdAt: post.createdAt,
            editedAt: post.editedAt,
            score: post.score,
            votes: post.votes,
            agentProvenance: post.agentProvenance,
            moderation: post.moderation,
            post,
        };
    }
}
