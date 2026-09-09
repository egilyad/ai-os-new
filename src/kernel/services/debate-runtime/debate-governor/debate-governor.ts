import type { Claim, GovernorState, SynthesisResult, Contradiction } from './types';
import type { DiversityState } from '../../agent-diversity/types';
import { createClaimGraph, addClaimsToGraph } from './claim-graph';
import { detectContradictions, hasOpenContradictions } from './contradiction-detector';
import { extractClaims } from './claim-extractor';
import { DiversityScorer } from '../../agent-diversity/diversity-scorer';

export class DebateGovernor {
    private state: GovernorState;
    public readonly diversityScorer: DiversityScorer;

    private readonly NOVELTY_THRESHOLD = 2;
    private readonly CONVERGENCE_PLATEAU_ROUNDS = 3;
    private readonly CONVERGENCE_THRESHOLD = 85;
    private maxRounds = 0;

    constructor() {
        this.diversityScorer = new DiversityScorer();
        this.state = {
            round: 0,
            graph: createClaimGraph(),
            contradictions: [],
            resolvedClaimIds: new Set(),
            noveltyScoreHistory: [],
            convergenceScore: 0,
            phase: 'active',
            lastUpdatedAt: Date.now(),
        };
    }

    /** Set maximum number of rounds before forced stop. */
    setMaxRounds(n: number): void {
        this.maxRounds = n;
    }

    ingestArgument(
        content: string,
        argumentId: string,
        speaker: string,
        role: string,
        round: number,
        agentId?: string,
        confidence?: number,
    ): Claim[] {
        const claims = extractClaims(
            content,
            argumentId,
            speaker,
            role,
            round,
            agentId,
            confidence,
        );
        addClaimsToGraph(this.state.graph, claims);

        this.state.round = round;
        this.state.lastUpdatedAt = Date.now();

        return claims;
    }

    updateContradictions(): Contradiction[] {
        const fresh = detectContradictions(this.state.graph);

        const merged: Contradiction[] = [...fresh];
        for (const existing of this.state.contradictions) {
            if (existing.status === 'resolved') {
                this.state.resolvedClaimIds.add(existing.claimA);
                this.state.resolvedClaimIds.add(existing.claimB);
                merged.push(existing);
            } else {
                const stillExists = fresh.some(
                    (f) => f.claimA === existing.claimA && f.claimB === existing.claimB,
                );
                if (!stillExists) {
                    merged.push({ ...existing, status: 'resolved', lastCheckedAt: Date.now() });
                    this.state.resolvedClaimIds.add(existing.claimA);
                    this.state.resolvedClaimIds.add(existing.claimB);
                }
            }
        }

        this.state.contradictions = merged;
        return merged;
    }

    computeConvergence(): number {
        const allClaims = Object.values(this.state.graph.claims);
        if (allClaims.length < 3) return 0;

        const bySpeaker = new Map<string, Claim[]>();
        for (const c of allClaims) {
            const list = bySpeaker.get(c.speaker) || [];
            list.push(c);
            bySpeaker.set(c.speaker, list);
        }

        const speakers = [...bySpeaker.keys()];
        if (speakers.length < 2) return 0;

        let totalOverlap = 0;
        let pairs = 0;
        for (let i = 0; i < speakers.length; i++) {
            for (let j = i + 1; j < speakers.length; j++) {
                const claimsA = bySpeaker.get(speakers[i]!)!;
                const claimsB = bySpeaker.get(speakers[j]!)!;
                for (const a of claimsA) {
                    for (const b of claimsB) {
                        const overlap = this.jaccard(a.text, b.text);
                        totalOverlap += overlap;
                        pairs++;
                    }
                }
            }
        }

        const avgOverlap = pairs > 0 ? (totalOverlap / pairs) * 100 : 0;
        this.state.convergenceScore = Math.min(
            100,
            0.3 * avgOverlap + 0.7 * (this.state.convergenceScore || avgOverlap),
        );
        return this.state.convergenceScore;
    }

    computeNovelty(): number {
        const allClaims = Object.values(this.state.graph.claims);
        if (allClaims.length < 2) return 1;

        const currentRoundClaims = allClaims.filter((c) => c.round === this.state.round);
        if (currentRoundClaims.length === 0) return 0;

        const priorClaims = allClaims.filter((c) => c.round < this.state.round);
        if (priorClaims.length === 0) return 1;

        let novelCount = 0;
        for (const cur of currentRoundClaims) {
            const isNovel = !priorClaims.some((p) => this.jaccard(cur.text, p.text) > 0.6);
            if (isNovel) novelCount++;
        }

        const score = novelCount / currentRoundClaims.length;
        this.state.noveltyScoreHistory.push(score);
        if (this.state.noveltyScoreHistory.length > 10) {
            this.state.noveltyScoreHistory.shift();
        }
        return score;
    }

    hasNoNovelClaims(): boolean {
        const history = this.state.noveltyScoreHistory;
        if (history.length < this.NOVELTY_THRESHOLD) return false;
        const recent = history.slice(-this.NOVELTY_THRESHOLD);
        return recent.every((s) => s < 0.2);
    }

    isConvergencePlateau(): boolean {
        const allClaims = Object.values(this.state.graph.claims);
        if (allClaims.length < 6) return false;

        const byRound = new Map<number, Claim[]>();
        for (const c of allClaims) {
            const list = byRound.get(c.round) || [];
            list.push(c);
            byRound.set(c.round, list);
        }

        const roundScores: number[] = [];
        for (const [, claims] of byRound) {
            if (claims.length < 2) continue;
            const speakers = [...new Set(claims.map((c) => c.speaker))];
            if (speakers.length < 2) continue;
            const aClaims = claims.filter((c) => c.speaker === speakers[0]);
            const bClaims = claims.filter((c) => c.speaker === speakers[1]);
            let total = 0;
            let pairs = 0;
            for (const a of aClaims) {
                for (const b of bClaims) {
                    total += this.jaccard(a.text, b.text);
                    pairs++;
                }
            }
            roundScores.push(pairs > 0 ? (total / pairs) * 100 : 0);
        }

        if (roundScores.length < this.CONVERGENCE_PLATEAU_ROUNDS) return false;
        const recent = roundScores.slice(-this.CONVERGENCE_PLATEAU_ROUNDS);
        const allAbove = recent.every((s) => s > this.CONVERGENCE_THRESHOLD);
        const stable = Math.max(...recent) - Math.min(...recent) < 10;
        return allAbove && stable;
    }

    allCriticalContradictionsResolved(): boolean {
        return !hasOpenContradictions(this.state.contradictions);
    }

    shouldStop(): boolean {
        if (this.state.phase !== 'active') return true;
        // Never stop before at least 1 full round after opening statements
        if (this.state.round < 2) return false;
        if (this.maxRounds > 0 && this.state.round >= this.maxRounds) return true;
        if (this.hasNoNovelClaims()) return true;
        if (this.isConvergencePlateau()) return true;
        if (
            this.state.contradictions.length > 0 &&
            this.allCriticalContradictionsResolved() &&
            Object.values(this.state.graph.claims).length > 5
        ) {
            return true;
        }
        return false;
    }

    getPhase(): 'active' | 'synthesis' | 'stopped' {
        return this.state.phase;
    }

    setPhase(phase: 'active' | 'synthesis' | 'stopped'): void {
        this.state.phase = phase;
    }

    getState(): GovernorState {
        return this.state;
    }

    updateDiversity(): DiversityState {
        const allClaims = Object.values(this.state.graph.claims);
        const bySpeaker = new Map<string, Claim[]>();
        for (const c of allClaims) {
            const list = bySpeaker.get(c.speaker) || [];
            list.push(c);
            bySpeaker.set(c.speaker, list);
        }
        return this.diversityScorer.update(
            bySpeaker,
            this.state.graph.edges,
            this.state.resolvedClaimIds,
        );
    }

    getDiversityState(): DiversityState {
        return this.diversityScorer.getState();
    }

    generateSynthesis(): SynthesisResult {
        const allClaims = Object.values(this.state.graph.claims);
        const bySpeaker = new Map<string, Claim[]>();
        for (const c of allClaims) {
            const list = bySpeaker.get(c.speaker) || [];
            list.push(c);
            bySpeaker.set(c.speaker, list);
        }

        const resolvedPoints: string[] = [];
        const unresolvedPoints: string[] = [];

        for (const c of allClaims) {
            if (c.status === 'resolved' || this.state.resolvedClaimIds.has(c.id)) {
                resolvedPoints.push(c.text);
            } else {
                unresolvedPoints.push(c.text);
            }
        }

        const contradictions = this.state.contradictions.filter((c) => c.status !== 'resolved');
        const coreDisagreement =
            contradictions.length > 0
                ? `${contradictions.length} unresolved contradiction(s) between ${[...new Set(contradictions.flatMap((c) => [this.state.graph.claims[c.claimA]?.speaker, this.state.graph.claims[c.claimB]?.speaker]))].filter(Boolean).join(' and ')}`
                : 'No fundamental disagreement remains';

        const consensus =
            allClaims.length > 0
                ? `Debate concluded after ${this.state.round} rounds with ${allClaims.length} claims and ${this.state.contradictions.length} contradictions detected (${this.state.contradictions.filter((c) => c.status === 'resolved').length} resolved).`
                : 'Insufficient data for synthesis';

        const phase = contradictions.length > 0 ? 'irreconcilable' : 'consensus';

        return { consensus, coreDisagreement, resolvedPoints, unresolvedPoints, phase };
    }

    reset(): void {
        this.diversityScorer.reset();
        this.state = {
            round: 0,
            graph: createClaimGraph(),
            contradictions: [],
            resolvedClaimIds: new Set(),
            noveltyScoreHistory: [],
            convergenceScore: 0,
            phase: 'active',
            lastUpdatedAt: Date.now(),
        };
    }

    private jaccard(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\W+/));
        const wordsB = new Set(b.toLowerCase().split(/\W+/));
        const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
        const union = new Set([...wordsA, ...wordsB]).size;
        return union > 0 ? intersection / union : 0;
    }
}
