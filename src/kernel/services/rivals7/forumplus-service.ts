/**
 * ForumPlusService — M.1 (Discourse-style forum powers, additive).
 *
 * Polls with options/deadline/one-vote, solved marks, trust levels 0–4
 * from activity counts, badges at thresholds. All in DAL kv
 * (`forumplus/*`) — the core Forum module is untouched.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IForumPlusService } from '../../contracts/rivals7';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ForumPlus');

interface PollDoc {
    id: string;
    topicId: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    closesAt?: number;
}

const BADGES: Array<{ name: string; activity: number }> = [
    { name: 'newcomer', activity: 1 },
    { name: 'regular', activity: 25 },
    { name: 'enthusiast', activity: 100 },
    { name: 'elder', activity: 400 },
];

export class ForumPlusService implements IForumPlusService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createPoll(topicId: string, question: string, options: string[], closesAt?: number): Promise<string> {
        if (options.length < 2) throw new Error('Poll needs at least 2 options');
        const doc: PollDoc = {
            id: genId('poll'),
            topicId,
            question: question.slice(0, 300),
            options: options.map((o) => o.slice(0, 120)).slice(0, 10),
            votes: {},
            closesAt,
        };
        await this.dal.kv.set(`forumplus-poll/${doc.id}`, doc);
        this.events.emit(EVENTS.FORUMPLUS_POLL, { pollId: doc.id });
        return doc.id;
    }

    async votePoll(pollId: string, voterId: string, option: string): Promise<Record<string, number>> {
        const doc = await this.dal.kv.get<PollDoc>(`forumplus-poll/${pollId}`);
        if (!doc) throw new Error(`Poll not found: ${pollId}`);
        if (doc.closesAt && Date.now() > doc.closesAt) throw new Error('Poll is closed');
        if (!doc.options.includes(option)) throw new Error(`Unknown option: ${option}`);
        doc.votes[voterId] = option;
        await this.dal.kv.set(`forumplus-poll/${pollId}`, doc);
        const counts: Record<string, number> = {};
        for (const o of doc.options) counts[o] = 0;
        for (const v of Object.values(doc.votes)) counts[v] = (counts[v] ?? 0) + 1;
        return counts;
    }

    async markSolved(topicId: string, postId: string): Promise<void> {
        await this.dal.kv.set(`forumplus-solved/${topicId}`, { postId, at: Date.now() });
        this.events.emit(EVENTS.FORUMPLUS_SOLVED, { topicId, postId });
    }

    async recordActivity(userId: string): Promise<number> {
        const key = `forumplus-activity/${userId}`;
        const n = ((await this.dal.kv.get<number>(key)) ?? 0) + 1;
        await this.dal.kv.set(key, n);
        return n;
    }

    async trustOf(userId: string): Promise<number> {
        const n = (await this.dal.kv.get<number>(`forumplus-activity/${userId}`)) ?? 0;
        if (n >= 400) return 4;
        if (n >= 100) return 3;
        if (n >= 25) return 2;
        if (n >= 1) return 1;
        return 0;
    }

    async awardBadges(userId: string): Promise<string[]> {
        const n = (await this.dal.kv.get<number>(`forumplus-activity/${userId}`)) ?? 0;
        const earned = BADGES.filter((b) => n >= b.activity).map((b) => b.name);
        await this.dal.kv.set(`forumplus-badges/${userId}`, earned);
        return earned;
    }
}
