/**
 * DecisionService — M.1 (Loomio-style decision tools, additive).
 *
 * Proposals with agree/abstain/disagree/block positions + quorum outcome,
 * dot-vote pools, ranked-choice (Borda count). All in DAL kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IDecisionService } from '../../contracts/rivals7';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Decision');

type Position = 'agree' | 'abstain' | 'disagree' | 'block';

interface ProposalDoc {
    id: string;
    title: string;
    options: string[];
    votes: Record<string, Position>;
    createdAt: number;
}

export class DecisionService implements IDecisionService {
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

    async propose(title: string, options: string[] = ['adopt']): Promise<string> {
        const doc: ProposalDoc = {
            id: genId('proposal'),
            title: title.slice(0, 300),
            options: options.map((o) => o.slice(0, 120)).slice(0, 8),
            votes: {},
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`decisions/${doc.id}`, doc);
        return doc.id;
    }

    async vote(proposalId: string, voterId: string, position: Position): Promise<void> {
        const doc = await this.dal.kv.get<ProposalDoc>(`decisions/${proposalId}`);
        if (!doc) throw new Error(`Proposal not found: ${proposalId}`);
        doc.votes[voterId] = position;
        await this.dal.kv.set(`decisions/${proposalId}`, doc);
    }

    async outcome(proposalId: string): Promise<{ counts: Record<string, number>; result: string; quorum: boolean }> {
        const doc = await this.dal.kv.get<ProposalDoc>(`decisions/${proposalId}`);
        if (!doc) throw new Error(`Proposal not found: ${proposalId}`);
        const counts: Record<string, number> = { agree: 0, abstain: 0, disagree: 0, block: 0 };
        for (const v of Object.values(doc.votes)) counts[v] = (counts[v] ?? 0) + 1;
        const total = Object.values(doc.votes).length;
        const quorum = total >= 3;
        let result = 'no-quorum';
        if (quorum) {
            if ((counts['block'] ?? 0) > 0) result = 'blocked';
            else if ((counts['agree'] ?? 0) > (counts['disagree'] ?? 0)) result = 'adopted';
            else result = 'rejected';
        }
        this.events.emit(EVENTS.DECISION_OUTCOME, { proposalId, result });
        return { counts, result, quorum };
    }

    async dotVote(topic: string, voterId: string, dots: Record<string, number>): Promise<void> {
        const key = `dots/${topic.slice(0, 120)}`;
        const pool = (await this.dal.kv.get<Record<string, Record<string, number>>>(key)) ?? {};
        const clean: Record<string, number> = {};
        let sum = 0;
        for (const [opt, n] of Object.entries(dots)) {
            const v = Math.max(0, Math.min(10, Math.floor(Number(n) || 0)));
            clean[opt.slice(0, 80)] = v;
            sum += v;
        }
        if (sum > 10) throw new Error('Dot budget is 10 per voter');
        pool[voterId] = clean;
        await this.dal.kv.set(key, pool);
    }

    async rankedVote(topic: string, voterId: string, ranking: string[]): Promise<void> {
        const key = `ranked/${topic.slice(0, 120)}`;
        const pool = (await this.dal.kv.get<Record<string, string[]>>(key)) ?? {};
        pool[voterId] = ranking.map((r) => r.slice(0, 80)).slice(0, 10);
        await this.dal.kv.set(key, pool);
    }

    async rankedOutcome(topic: string): Promise<Array<{ option: string; score: number }>> {
        const pool = (await this.dal.kv.get<Record<string, string[]>>(`ranked/${topic.slice(0, 120)}`)) ?? {};
        // Borda count: top rank earns N points, next N-1, ...
        const scores = new Map<string, number>();
        for (const ranking of Object.values(pool)) {
            const n = ranking.length;
            ranking.forEach((opt, i) => {
                scores.set(opt, (scores.get(opt) ?? 0) + (n - i));
            });
        }
        return [...scores.entries()]
            .map(([option, score]) => ({ option, score }))
            .sort((a, b) => b.score - a.score);
    }
}
