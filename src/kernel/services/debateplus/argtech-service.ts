/**
 * ArgTechService — L.2 (formal argumentation toolkit, additive).
 *
 * - mineClaims: sentence split + claim heuristics (IBM Debater-lite).
 * - Dung AF: arguments + attacks, grounded extension (fixed-point),
 *   preferred extensions (brute force,Guard ≤12 args).
 * - Toulmin cards: 6 fields, completeness score, gaps list.
 * - Brier: per-claim forecasts, resolution scoring.
 * - Kialo trees: pro/con branches with impact votes, recursive score.
 * All in DAL kv (`argtech/*`) — no schema change.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IArgTechService } from '../../contracts/debateplus';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ArgTech');

const CLAIM_HINT = /\b(should|must|because|therefore|prove|shows|demonstrates|лучше|нужно|потому что|следовательно|доказывает)\b/i;

interface ToulminDoc {
    id: string;
    claim: string;
    grounds?: string;
    warrant?: string;
    backing?: string;
    qualifier?: string;
    rebuttal?: string;
}

interface ForecastDoc {
    claimId: string;
    forecasts: Array<{ forecaster: string; p: number }>;
    resolved?: boolean;
    happened?: boolean;
}

interface ClaimNode {
    id: string;
    parentId: string | null;
    side: 'pro' | 'con' | 'root';
    text: string;
    impact: number;
    votes: number;
}

export class ArgTechService implements IArgTechService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('ArgTech', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    // ── Mining ──
    async mineClaims(text: string): Promise<Array<{ claim: string; evidenceHint: string }>> {
        const sentences = text.split(/(?<=[.!?])\s+/u).map((s) => s.trim()).filter((s) => s.length > 20);
        let candidates = sentences.filter((s) => CLAIM_HINT.test(s)).slice(0, 10);
        if (candidates.length === 0 && this.llm && sentences.length > 0) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Extract central claims, one per line starting with "- ". Max 8.' },
                        { role: 'user', content: text.slice(0, 4000) },
                    ],
                    { temperature: 0.2, maxTokens: 600 },
                );
                if (!res.error) {
                    const lines = res.content.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter((l) => l.length > 0);
                    if (lines.length > 0) candidates = lines.slice(0, 10);
                }
            } catch (e) {
                LOGGER.warn('ArgTech', 'mine llm failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        if (candidates.length === 0) candidates = sentences.slice(0, 3);
        return candidates.map((claim) => ({
            claim: claim.slice(0, 400),
            evidenceHint: `Search evidence for: ${claim.split(/\s+/).slice(0, 6).join(' ')}`,
        }));
    }

    // ── Dung ──
    async addDungArgument(id: string, text: string): Promise<void> {
        const args = (await this.dal.kv.get<Record<string, string>>('dung/args')) ?? {};
        args[id.slice(0, 80)] = text.slice(0, 500);
        await this.dal.kv.set('dung/args', args);
    }

    async addDungAttack(from: string, to: string): Promise<void> {
        const args = (await this.dal.kv.get<Record<string, string>>('dung/args')) ?? {};
        if (!args[from] || !args[to]) throw new Error('Both arguments must exist for an attack');
        const attacks = (await this.dal.kv.get<Array<[string, string]>>('dung/attacks')) ?? [];
        attacks.push([from, to]);
        await this.dal.kv.set('dung/attacks', attacks);
        this.events.emit(EVENTS.DUNG_ATTACK, { from, to });
    }

    /** Grounded extension via the characteristic-function fixed point. */
    async groundedExtension(): Promise<string[]> {
        const args = (await this.dal.kv.get<Record<string, string>>('dung/args')) ?? {};
        const attacks = (await this.dal.kv.get<Array<[string, string]>>('dung/attacks')) ?? [];
        const ids = Object.keys(args);
        const attackers = new Map<string, Set<string>>();
        for (const id of ids) attackers.set(id, new Set());
        for (const [from, to] of attacks) attackers.get(to)?.add(from);

        const defends = (s: Set<string>, a: string): boolean => {
            const atts = attackers.get(a) ?? new Set();
            if (atts.size === 0) return true;
            for (const b of atts) {
                const bAtts = attackers.get(b) ?? new Set();
                if (![...bAtts].some((c) => s.has(c))) return false;
            }
            return true;
        };
        let ext = new Set<string>();
        for (;;) {
            const next = new Set([...ext, ...ids.filter((a) => defends(ext, a))]);
            if (next.size === ext.size) break;
            ext = next;
            if (ext.size > ids.length + 1) break;
        }
        return [...ext].sort();
    }

    /** Preferred extensions by brute force (capped at 12 arguments). */
    async preferredExtensions(): Promise<string[][]> {
        const args = (await this.dal.kv.get<Record<string, string>>('dung/args')) ?? {};
        const attacks = (await this.dal.kv.get<Array<[string, string]>>('dung/attacks')) ?? [];
        const ids = Object.keys(args);
        if (ids.length > 12) throw new Error('Preferred enumeration capped at 12 arguments — RUNTIME-PENDING for >12 (Kialo live)');
        const att = new Map<string, Set<string>>();
        for (const id of ids) att.set(id, new Set());
        for (const [from, to] of attacks) att.get(to)?.add(from);
        const conflictFree = (s: Set<string>): boolean => {
            for (const a of s) {
                for (const b of att.get(a) ?? new Set()) {
                    if (s.has(b)) return false;
                }
            }
            return true;
        };
        const defendsAll = (s: Set<string>): boolean => {
            for (const a of s) {
                for (const b of att.get(a) ?? new Set()) {
                    const countered = [...(att.get(b) ?? new Set())].some((c) => s.has(c));
                    if (!countered) return false;
                }
            }
            return true;
        };
        const admissible: Array<Set<string>> = [];
        for (let mask = 0; mask < 1 << ids.length; mask++) {
            const s = new Set(ids.filter((_, i) => mask & (1 << i)));
            if (conflictFree(s) && defendsAll(s)) admissible.push(s);
        }
        return admissible
            .filter((s) => !admissible.some((t) => t.size > s.size && [...s].every((x) => t.has(x))))
            .map((s) => [...s].sort());
    }

    // ── Toulmin ──
    async createToulmin(input: {
        claim: string;
        grounds?: string;
        warrant?: string;
        backing?: string;
        qualifier?: string;
        rebuttal?: string;
    }): Promise<{ id: string; completeness: number; gaps: string[] }> {
        const fields: Array<[string, string | undefined, number]> = [
            ['grounds', input.grounds, 0.3],
            ['warrant', input.warrant, 0.25],
            ['backing', input.backing, 0.15],
            ['qualifier', input.qualifier, 0.1],
            ['rebuttal', input.rebuttal, 0.2],
        ];
        const gaps: string[] = [];
        let completeness = 0;
        for (const [name, value, weight] of fields) {
            if (value && value.trim().length > 0) completeness += weight;
            else gaps.push(name);
        }
        const doc: ToulminDoc = {
            id: genId('toulmin'),
            claim: input.claim.slice(0, 500),
            grounds: input.grounds?.slice(0, 2000),
            warrant: input.warrant?.slice(0, 2000),
            backing: input.backing?.slice(0, 2000),
            qualifier: input.qualifier?.slice(0, 300),
            rebuttal: input.rebuttal?.slice(0, 2000),
        };
        await this.dal.kv.set(`toulmin/${doc.id}`, doc);
        this.events.emit(EVENTS.TOULMIN_CARD, {
            cardId: doc.id,
            completeness: Math.round(completeness * 100) / 100,
        });
        return { id: doc.id, completeness: Math.round(completeness * 100) / 100, gaps };
    }

    // ── Brier ──
    async forecast(claimId: string, forecaster: string, probability: number): Promise<void> {
        const p = Math.max(0, Math.min(1, probability));
        const doc: ForecastDoc =
            (await this.dal.kv.get<ForecastDoc>(`brier/${claimId}`)) ?? { claimId, forecasts: [] };
        if (doc.resolved) throw new Error(`Claim ${claimId} already resolved`);
        doc.forecasts = doc.forecasts.filter((f) => f.forecaster !== forecaster);
        doc.forecasts.push({ forecaster: forecaster.slice(0, 120), p });
        await this.dal.kv.set(`brier/${claimId}`, doc);
    }

    async resolveClaim(claimId: string, happened: boolean): Promise<{ brier: number; forecasters: number }> {
        const doc = await this.dal.kv.get<ForecastDoc>(`brier/${claimId}`);
        if (!doc) throw new Error(`No forecasts for claim: ${claimId}`);
        if (doc.forecasts.length === 0) throw new Error(`No forecasts recorded for ${claimId}`);
        const outcome = happened ? 1 : 0;
        const mean =
            doc.forecasts.reduce((a, f) => a + (f.p - outcome) * (f.p - outcome), 0) / doc.forecasts.length;
        doc.resolved = true;
        doc.happened = happened;
        await this.dal.kv.set(`brier/${claimId}`, doc);
        const brier = Math.round(mean * 1000) / 1000;
        this.events.emit(EVENTS.BRIER_RESOLVED, { claimId, brier });
        return { brier, forecasters: doc.forecasts.length };
    }

    // ── Kialo trees ──
    async plantThesis(thesis: string): Promise<string> {
        const id = genId('thesis');
        const root: ClaimNode = {
            id: `${id}:root`,
            parentId: null,
            side: 'root',
            text: thesis.slice(0, 500),
            impact: 3,
            votes: 0,
        };
        await this.dal.kv.set(`claimtree/${id}`, { root, nodes: [root] as ClaimNode[] });
        return id;
    }

    async branchClaim(treeId: string, parentId: string, side: 'pro' | 'con', text: string): Promise<string> {
        const tree = await this.dal.kv.get<{ root: ClaimNode; nodes: ClaimNode[] }>(`claimtree/${treeId}`);
        if (!tree) throw new Error(`Claim tree not found: ${treeId}`);
        if (!tree.nodes.some((n) => n.id === parentId)) throw new Error(`Parent node not found: ${parentId}`);
        const node: ClaimNode = {
            id: genId('claim'),
            parentId,
            side,
            text: text.slice(0, 500),
            impact: 3,
            votes: 0,
        };
        tree.nodes.push(node);
        await this.dal.kv.set(`claimtree/${treeId}`, tree);
        return node.id;
    }

    async voteImpact(nodeId: string, impact: number): Promise<void> {
        const rows = await this.dal.kv.list('claimtree/');
        for (const row of rows) {
            const tree = row.value as { root: ClaimNode; nodes: ClaimNode[] };
            const node = tree.nodes.find((n) => n.id === nodeId);
            if (node) {
                node.impact = Math.max(1, Math.min(5, Math.round(impact)));
                node.votes += 1;
                await this.dal.kv.set(row.id, tree);
                return;
            }
        }
        throw new Error(`Claim node not found: ${nodeId}`);
    }

    async treeScore(treeId: string): Promise<{ pro: number; con: number; verdict: string }> {
        const tree = await this.dal.kv.get<{ root: ClaimNode; nodes: ClaimNode[] }>(`claimtree/${treeId}`);
        if (!tree) throw new Error(`Claim tree not found: ${treeId}`);
        const children = new Map<string, ClaimNode[]>();
        for (const n of tree.nodes) {
            if (!n.parentId) continue;
            const list = children.get(n.parentId) ?? [];
            list.push(n);
            children.set(n.parentId, list);
        }
        const scoreOf = (id: string): number => {
            const kids = children.get(id) ?? [];
            let total = 0;
            for (const k of kids) {
                const weight = (k.impact / 5) * (1 + Math.min(k.votes, 10) / 10);
                total += (k.side === 'pro' ? 1 : -1) * weight + scoreOf(k.id) * 0.5;
            }
            return total;
        };
        const total = scoreOf(tree.root.id);
        const pro = Math.max(0, total);
        const con = Math.max(0, -total);
        return {
            pro: Math.round(pro * 100) / 100,
            con: Math.round(con * 100) / 100,
            verdict: total > 0.1 ? 'pro' : total < -0.1 ? 'con' : 'balanced',
        };
    }
}
