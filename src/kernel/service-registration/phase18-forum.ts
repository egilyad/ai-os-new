/**
 * Phase 18 — Agent Forum.
 *
 * Registers the Agent Forum (async persistent threads) service and wires the
 * event bridges:
 *   - debate verdicts → "case study" posts
 *   - crystal formation → announcements
 *   - post added with question pattern → knowledge generator trigger
 * Depends on phase 0 (dal + eventBus).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IForumService } from '../contracts/forum';
import type { IKnowledgeGeneratorService } from '../contracts/knowledge-generator';
import type { DataAccessLayer } from '../dal';
import type { ForumAuthor } from '../types/forum-types';
import { ForumService } from '../services/forum/forum-service';
import { EVENTS } from '../events/event-names';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('ForumBridge');

const SYSTEM_AUTHOR: ForumAuthor = { kind: 'agent', id: 'system', displayName: 'Система' };

const QUESTION_PATTERN =
    /(\?$|вопрос|как |почему |что |стоит ли |какой |какая |какие |расскажи|объясни)/i;

let knowledgeGen: IKnowledgeGeneratorService | undefined;

export const registerPhase18: Phase = ({ register }) => {
    register('forumService', (c: IContainer) => {
        const forum = new ForumService({
            repository: c.get<DataAccessLayer>('dal').forum,
            eventBus: c.get<IEventBus>('eventBus'),
        });

        knowledgeGen = c.get<IKnowledgeGeneratorService>('knowledgeGenerator');

        wireForumBridge(c.get<IEventBus>('eventBus'), forum);
        wireForumToGeneratorBridge(c.get<IEventBus>('eventBus'), forum);

        return forum;
    });
};

function wireForumBridge(eventBus: IEventBus, forum: IForumService): void {
    eventBus.onSafe<{ sessionId?: string; verdict?: unknown }>(
        EVENTS.DEBATE_VERDICT_GENERATED,
        (data) => {
            void (async () => {
                try {
                    const topicId = await ensureTopic(forum, 'case-study', 'Кейсы дебатов');
                    await forum.postMessage(
                        topicId,
                        SYSTEM_AUTHOR,
                        `Итог дебатов ${data.sessionId ?? '—'}: зафиксирован вердикт (авто-пост).`,
                    );
                } catch (e) {
                    LOGGER.warn('ForumBridge', 'failed to post debate verdict', { error: e });
                }
            })();
        },
    );

    eventBus.onSafe<{ crystalId?: string; statement?: string }>(EVENTS.CRYSTAL_FORMED, (data) => {
        void (async () => {
            try {
                const topicId = await ensureTopic(forum, 'announcements', 'Анонсы кристаллов');
                await forum.postMessage(
                    topicId,
                    SYSTEM_AUTHOR,
                    `Сформирован кристалл ${data.crystalId ?? ''}: ${(data.statement ?? '').slice(0, 240)}`,
                );
            } catch (e) {
                LOGGER.warn('ForumBridge', 'failed to post crystal announcement', { error: e });
            }
        })();
    });
}

function wireForumToGeneratorBridge(eventBus: IEventBus, forum: IForumService): void {
    eventBus.onSafe<{ postId: string; topicId: string; authorId: string }>(
        EVENTS.FORUM_POST_ADDED,
        (data) => {
            if (data.authorId === 'system') return;

            void (async () => {
                try {
                    const thread = await forum.getThread(data.topicId);
                    if (!thread) return;
                    const post = thread.posts.find((p) => p.id === data.postId);
                    if (!post) return;
                    if (!QUESTION_PATTERN.test(post.body)) return;

                    if (!knowledgeGen) return;
                    await knowledgeGen.generateFromTrigger({
                        kind: 'forum-question',
                        topicId: data.topicId,
                    });
                    LOGGER.info('ForumBridge', 'triggered knowledge generator for forum question', {
                        topicId: data.topicId,
                        postId: data.postId,
                    });
                } catch (e) {
                    LOGGER.warn('ForumBridge', 'failed to trigger knowledge generator', {
                        topicId: data.topicId,
                        error: e,
                    });
                }
            })();
        },
    );
}

async function ensureTopic(forum: IForumService, category: string, title: string): Promise<string> {
    const page = await forum.listTopics({ category });
    if (page.items.length > 0) return page.items[0]!.id;
    return forum.createTopic({ title, category, author: SYSTEM_AUTHOR });
}
