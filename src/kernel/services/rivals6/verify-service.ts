/**
 * VerifyService — K.3 (Notion/Guru-style verification, additive).
 *
 * Submitted answers wait in a review queue (kv); humans verify (served
 * first on later queries) or flag them out. Unanswered questions accumulate
 * as gaps for knowledge gardeners.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IVerifyService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Verify');

interface VerifyDoc {
    id: string;
    question: string;
    answer: string;
    source?: string;
    status: 'pending' | 'verified' | 'flagged';
    createdAt: number;
}

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function overlap(a: string, b: string): number {
    const sa = tokens(a);
    if (sa.size === 0) return 0;
    const sb = tokens(b);
    let hit = 0;
    for (const t of sa) if (sb.has(t)) hit += 1;
    return hit / sa.size;
}

export class VerifyService implements IVerifyService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('Verify', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async submitAnswer(question: string, answer: string, source?: string): Promise<string> {
        const doc: VerifyDoc = {
            id: genId('verify'),
            question: question.slice(0, 500),
            answer: answer.slice(0, 4000),
            source: source?.slice(0, 300),
            status: 'pending',
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`verify/${doc.id}`, doc);
        return doc.id;
    }

    async verify(id: string, ok: boolean): Promise<void> {
        const doc = await this.dal.kv.get<VerifyDoc>(`verify/${id}`);
        if (!doc) throw new Error(`Answer not found: ${id}`);
        doc.status = ok ? 'verified' : 'flagged';
        await this.dal.kv.set(`verify/${id}`, doc);
    }

    async logGap(question: string): Promise<void> {
        await this.dal.kv.set(`gaps/${genId('gap')}`, { question: question.slice(0, 500), at: Date.now() });
    }

    async verifiedAnswer(question: string): Promise<string | null> {
        const rows = await this.dal.kv.list('verify/');
        let best: VerifyDoc | undefined;
        let bestScore = 0.5;
        for (const r of rows) {
            const d = r.value as VerifyDoc;
            if (d.status !== 'verified') continue;
            const s = overlap(question, d.question);
            if (s > bestScore) {
                bestScore = s;
                best = d;
            }
        }
        return best ? `${best.answer}${best.source ? `\n(source: ${best.source})` : ''}` : null;
    }

    async gaps(): Promise<string[]> {
        const rows = await this.dal.kv.list('gaps/');
        return rows
            .map((r) => (r.value as { question: string }).question)
            .slice(-100);
    }
}
