/**
 * WriterService — J.2 (enterprise content guardrails, additive).
 *
 * Terminology (must-use / banned, kv-persisted) + claim detection: sentences
 * that state facts (numbers, named entities, quotes) must carry a citation
 * marker `[...]`. Returns a 0..1 style score with human-readable issues.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IWriterService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Writer');

const FACT_HINT = /\b\d+([.,]\d+)?(%|ms|s|x\b)?\b|according to|study|report|increased|decreased|grew|fell|"|«/i;

export class WriterService implements IWriterService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async setTerminology(mustUse: string[], banned: string[]): Promise<void> {
        await this.dal.kv.set('writer/terms', {
            mustUse: mustUse.map((t) => t.slice(0, 80)),
            banned: banned.map((t) => t.slice(0, 80)),
        });
    }

    async check(text: string): Promise<{ score: number; issues: string[] }> {
        const issues: string[] = [];
        const terms = (await this.dal.kv.get<{ mustUse: string[]; banned: string[] }>('writer/terms')) ?? {
            mustUse: [],
            banned: [],
        };
        const lower = text.toLowerCase();
        for (const banned of terms.banned) {
            if (banned && lower.includes(banned.toLowerCase())) {
                issues.push(`banned term: "${banned}"`);
            }
        }
        for (const must of terms.mustUse) {
            if (must && !lower.includes(must.toLowerCase())) {
                issues.push(`missing preferred term: "${must}"`);
            }
        }
        const sentences = text.split(/(?<=[.!?])\s+/u).filter((s) => s.trim().length > 0);
        let uncited = 0;
        for (const s of sentences) {
            if (FACT_HINT.test(s) && !/\[[^\]]+\]/.test(s)) {
                uncited += 1;
            }
        }
        if (uncited > 0) issues.push(`${uncited} factual claim(s) without citation [...]`);
        const score = Math.max(0, 1 - issues.length * 0.15 - uncited * 0.05);
        return { score: Math.round(score * 100) / 100, issues: issues.slice(0, 20) };
    }
}
