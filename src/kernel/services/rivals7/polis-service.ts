/**
 * PolisService — M.1 (opinion clustering, additive).
 *
 * Statements with agree/disagree/pass votes per voter; k-means-lite over
 * vote vectors (agree=1, pass=0, disagree=-1, missing=0); consensus
 * statements = high mean agreement AND low cross-cluster variance.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IPolisService } from '../../contracts/rivals7';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Polis');

function hashStr(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

export class PolisService implements IPolisService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Polis', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async addStatement(convoId: string, text: string): Promise<string> {
        const id = genId('stmt');
        const stmts = (await this.dal.kv.get<Record<string, string>>(`polis-stmt/${convoId}`)) ?? {};
        stmts[id] = text.slice(0, 500);
        await this.dal.kv.set(`polis-stmt/${convoId}`, stmts);
        return id;
    }

    async vote(
        convoId: string,
        statementId: string,
        voterId: string,
        vote: 'agree' | 'disagree' | 'pass',
    ): Promise<void> {
        const votes = (await this.dal.kv.get<Record<string, Record<string, string>>>(`polis-votes/${convoId}`)) ?? {};
        const per = votes[statementId] ?? {};
        per[voterId] = vote;
        votes[statementId] = per;
        await this.dal.kv.set(`polis-votes/${convoId}`, votes);
    }

    async clusters(convoId: string, k = 2): Promise<Array<{ id: number; members: string[] }>> {
        const { voters, vectors } = await this.matrix(convoId);
        if (voters.length === 0) return [];
        const groups = Math.max(1, Math.min(k, voters.length));
        // Deterministic k-means-lite with hash-seeded centroids, 10 iterations.
        const dim = vectors[0]?.length ?? 0;
        const centroids: number[][] = [];
        for (let c = 0; c < groups; c++) {
            const seed = voters[(hashStr(`${convoId}:${c}`) % voters.length) as number] as string;
            centroids.push([...(vectors[voters.indexOf(seed)] ?? new Array<number>(dim).fill(0))]);
        }
        let assign = new Array<number>(voters.length).fill(0);
        for (let iter = 0; iter < 10; iter++) {
            const next = voters.map((_, i) => {
                let best = 0;
                let bestD = Infinity;
                centroids.forEach((cent, c) => {
                    const v = vectors[i] as number[];
                    let d = 0;
                    for (let dI = 0; dI < dim; dI++) d += ((v[dI] ?? 0) - (cent[dI] ?? 0)) ** 2;
                    if (d < bestD) {
                        bestD = d;
                        best = c;
                    }
                });
                return best;
            });
            assign = next;
            for (let c = 0; c < groups; c++) {
                const members = vectors.filter((_, i) => assign[i] === c);
                if (members.length === 0) continue;
                centroids[c] = new Array<number>(dim).fill(0).map((_, dI) => {
                    const vals = members.map((m) => m[dI] ?? 0);
                    return vals.reduce((a, b) => a + b, 0) / vals.length;
                });
            }
        }
        this.events.emit(EVENTS.POLIS_CLUSTERED, { convoId, groups });
        return Array.from({ length: groups }, (_, c) => ({
            id: c,
            members: voters.filter((_, i) => assign[i] === c),
        }));
    }

    async consensus(convoId: string): Promise<Array<{ statementId: string; text: string; agreement: number }>> {
        const stmts = (await this.dal.kv.get<Record<string, string>>(`polis-stmt/${convoId}`)) ?? {};
        const votes = (await this.dal.kv.get<Record<string, Record<string, string>>>(`polis-votes/${convoId}`)) ?? {};
        const groups = await this.clusters(convoId, 2);
        const out: Array<{ statementId: string; text: string; agreement: number }> = [];
        for (const [id, text] of Object.entries(stmts)) {
            const per = votes[id] ?? {};
            const vals = Object.values(per).map((v) => (v === 'agree' ? 1 : v === 'disagree' ? -1 : 0));
            if (vals.length < 2) continue;
            let meanSum = 0;
            for (const x of vals) meanSum += x;
            const mean = meanSum / vals.length;
            // Cross-cluster variance: per-group means must agree in sign.
            const groupMeans = groups.map((g) => {
                const gv = g.members.map((m) => {
                    const v = per[m];
                    return v === 'agree' ? 1 : v === 'disagree' ? -1 : 0;
                });
                if (gv.length === 0) return 0;
                let gsum = 0;
                for (const x of gv) gsum += x;
                return gsum / gv.length;
            });
            const sameSign = groupMeans.every((m) => m >= 0) || groupMeans.every((m) => m <= 0);
            if (mean >= 0.4 && sameSign) {
                out.push({ statementId: id, text, agreement: Math.round(mean * 100) / 100 });
            }
        }
        return out.sort((a, b) => b.agreement - a.agreement);
    }

    private async matrix(convoId: string): Promise<{ voters: string[]; vectors: number[][] }> {
        const stmts = (await this.dal.kv.get<Record<string, string>>(`polis-stmt/${convoId}`)) ?? {};
        const votes = (await this.dal.kv.get<Record<string, Record<string, string>>>(`polis-votes/${convoId}`)) ?? {};
        const voterSet = new Set<string>();
        for (const per of Object.values(votes)) {
            for (const v of Object.keys(per)) voterSet.add(v);
        }
        const voters = [...voterSet].sort();
        const ids = Object.keys(stmts).sort();
        const vectors = voters.map((v) =>
            ids.map((id) => {
                const val = votes[id]?.[v];
                return val === 'agree' ? 1 : val === 'disagree' ? -1 : 0;
            }),
        );
        return { voters, vectors };
    }
}
