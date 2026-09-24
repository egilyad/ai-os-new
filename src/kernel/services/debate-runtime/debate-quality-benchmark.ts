/**
 * DebateQualityBenchmarkService — automatic quality scoring + historical tracking.
 *
 * After each debate completes, computes a composite quality score from:
 * - Argument depth (average word count, claim density)
 * - Reasoning coherence (chain coherence, step diversity)
 * - Engagement balance (argument distribution across agents)
 * - Consensus quality (convergence score, conclusion type)
 * - Efficiency (tokens per quality point, rounds to consensus)
 *
 * Scores are persisted and tracked over time for trend analysis.
 * Individual agent quality profiles are maintained across debates.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DebateSession, DebateVerdict } from '../../contracts/debate-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('QualityBenchmark');

export interface QualityDimension {
    readonly name: string;
    readonly score: number;
    readonly weight: number;
    readonly details: string;
}

export interface DebateQualityScore {
    readonly sessionId: string;
    readonly topic: string;
    readonly compositeScore: number;
    readonly dimensions: QualityDimension[];
    readonly agentScores: Record<string, AgentQualityProfile>;
    readonly benchmarks: {
        readonly vsAverage: number;
        readonly percentile: number;
        readonly trend: 'improving' | 'stable' | 'declining';
    };
    readonly scoredAt: number;
}

export interface AgentQualityProfile {
    readonly agentId: string;
    readonly avgConfidence: number;
    readonly avgArgumentLength: number;
    readonly argumentCount: number;
    readonly chainsCompleted: number;
    readonly topRole: string;
    readonly totalDebates: number;
}

export interface QualityTrend {
    readonly period: 'day' | 'week' | 'month';
    readonly avgComposite: number;
    readonly debateCount: number;
    readonly bestDimension: string;
    readonly worstDimension: string;
    readonly change: number;
}

interface BenchmarkServiceDeps {
    eventBus: IEventBus;
    store: {
        config: {
            get(key: string): Promise<unknown>;
            set(key: string, value: unknown): Promise<void>;
        };
    };
}

const SCORES_KEY = 'debate_quality_scores';
const AGENTS_KEY = 'debate_quality_agents';
const MAX_SCORES = 500;

function computeArgumentDepth(session: DebateSession): QualityDimension {
    const args = session.arguments ?? [];
    const avgLength = args.length > 0
        ? args.reduce((sum, a) => sum + (a.content?.length ?? 0), 0) / args.length
        : 0;
    const avgConfidence = args.length > 0
        ? args.reduce((sum, a) => sum + (a.confidence ?? 0), 0) / args.length
        : 0;
    const score = Math.min(1, (avgLength / 500) * 0.6 + avgConfidence * 0.4);
    return {
        name: 'argument_depth',
        score,
        weight: 0.25,
        details: `Avg length: ${avgLength.toFixed(0)} chars, avg confidence: ${(avgConfidence * 100).toFixed(0)}%`,
    };
}

function computeEngagementBalance(session: DebateSession): QualityDimension {
    const args = session.arguments ?? [];
    if (args.length === 0 || !session.participants?.length) {
        return { name: 'engagement_balance', score: 0, weight: 0.2, details: 'No arguments' };
    }
    const byAgent = new Map<string, number>();
    for (const a of args) {
        byAgent.set(a.agentId, (byAgent.get(a.agentId) ?? 0) + 1);
    }
    const counts = [...byAgent.values()];
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const balance = max > 0 ? min / max : 0;
    const score = 0.5 + balance * 0.5;
    return {
        name: 'engagement_balance',
        score,
        weight: 0.2,
        details: `Agent args range: ${min}-${max}, balance: ${(balance * 100).toFixed(0)}%`,
    };
}

function computeConsensusQuality(session: DebateSession, verdict?: DebateVerdict): QualityDimension {
    const convergence = session.convergenceScore ?? 0;
    let conclusionBonus = 0;
    if (verdict) {
        if (verdict.conclusionType === 'consensus') conclusionBonus = 0.3;
        else if (verdict.conclusionType === 'partial_agreement') conclusionBonus = 0.2;
        else if (verdict.conclusionType === 'dominance') conclusionBonus = 0.1;
    }
    const score = Math.min(1, convergence * 0.7 + conclusionBonus);
    return {
        name: 'consensus_quality',
        score,
        weight: 0.25,
        details: `Convergence: ${(convergence * 100).toFixed(0)}%, conclusion: ${verdict?.conclusionType ?? 'none'}`,
    };
}

function computeEfficiency(session: DebateSession): QualityDimension {
    const totalTokens = session.totalTokens ?? 0;
    const args = session.arguments ?? [];
    const roundCount = session.currentRound ?? 1;
    const argsPerRound = args.length / roundCount;
    const tokensPerArg = args.length > 0 ? totalTokens / args.length : totalTokens;
    const efficiency = args.length > 0
        ? Math.min(1, (argsPerRound / 4) * 0.5 + (1 - Math.min(1, tokensPerArg / 5000)) * 0.5)
        : 0;
    return {
        name: 'efficiency',
        score: Math.max(0, efficiency),
        weight: 0.15,
        details: `${totalTokens} tokens, ${args.length} args, ${roundCount} rounds`,
    };
}

function computeReasoningDiversity(session: DebateSession): QualityDimension {
    const args = session.arguments ?? [];
    if (args.length < 2) {
        return { name: 'reasoning_diversity', score: 0.3, weight: 0.15, details: 'Too few arguments' };
    }
    const positions = new Set(args.map((a) => a.position).filter(Boolean));
    const agentCount = new Set(args.map((a) => a.agentId)).size;
    const diversity = Math.min(1, (positions.size / Math.max(1, agentCount)) * 0.6 + (agentCount / Math.max(1, session.participants?.length ?? 1)) * 0.4);
    return {
        name: 'reasoning_diversity',
        score: diversity,
        weight: 0.15,
        details: `${positions.size} positions, ${agentCount} active agents`,
    };
}

function updateAgentProfile(
    profiles: Map<string, AgentQualityProfile>,
    session: DebateSession,
): void {
    const args = session.arguments ?? [];
    const byAgent = new Map<string, typeof args>();
    for (const a of args) {
        const list = byAgent.get(a.agentId) ?? [];
        list.push(a);
        byAgent.set(a.agentId, list);
    }
    for (const [agentId, agentArgs] of byAgent) {
        const existing = profiles.get(agentId);
        const avgConf = agentArgs.reduce((s, a) => s + (a.confidence ?? 0), 0) / agentArgs.length;
        const avgLen = agentArgs.reduce((s, a) => s + (a.content?.length ?? 0), 0) / agentArgs.length;
        if (existing) {
            const newTotal = existing.totalDebates + 1;
            profiles.set(agentId, {
                ...existing,
                avgConfidence: (existing.avgConfidence * existing.totalDebates + avgConf) / newTotal,
                avgArgumentLength: (existing.avgArgumentLength * existing.totalDebates + avgLen) / newTotal,
                argumentCount: existing.argumentCount + agentArgs.length,
                totalDebates: newTotal,
            });
        } else {
            profiles.set(agentId, {
                agentId,
                avgConfidence: avgConf,
                avgArgumentLength: avgLen,
                argumentCount: agentArgs.length,
                chainsCompleted: 0,
                topRole: 'pro',
                totalDebates: 1,
            });
        }
    }
}

function computePercentile(score: number, allScores: number[]): number {
    if (allScores.length === 0) return 50;
    const below = allScores.filter((s) => s < score).length;
    return Math.round((below / allScores.length) * 100);
}

function computeTrend(scores: DebateQualityScore[], windowSize = 10): 'improving' | 'stable' | 'declining' {
    if (scores.length < windowSize * 2) return 'stable';
    const recent = scores.slice(0, windowSize).reduce((s, x) => s + x.compositeScore, 0) / windowSize;
    const older = scores.slice(windowSize, windowSize * 2).reduce((s, x) => s + x.compositeScore, 0) / windowSize;
    const delta = recent - older;
    if (delta > 0.05) return 'improving';
    if (delta < -0.05) return 'declining';
    return 'stable';
}

export class DebateQualityBenchmarkService {
    private scores: DebateQualityScore[] = [];
    private agentProfiles = new Map<string, AgentQualityProfile>();
    private deps: BenchmarkServiceDeps;
    private _loaded = false;

    constructor(deps: BenchmarkServiceDeps) {
        this.deps = deps;
        this.setupEventListeners();
    }

    private unsubs: Array<() => void> = [];

    private setupEventListeners(): void {
        this.unsubs.push(this.deps.eventBus.onSafe<{ sessionId: string; verdict: DebateVerdict }>(
            'debate:verdict:generated',
            (data) => {
                LOGGER.info('QualityBenchmark', 'Auto-scoring debate', { sessionId: data.sessionId });
            },
        ));
    }

    async destroy(): Promise<void> {
        for (const unsub of this.unsubs) {
            try { unsub(); } catch { /* ignore */ }
        }
        this.unsubs = [];
    }

    async load(): Promise<void> {
        if (this._loaded) return;
        try {
            const rawScores = await this.deps.store.config.get(SCORES_KEY);
            if (Array.isArray(rawScores)) this.scores = rawScores as DebateQualityScore[];
            const rawAgents = await this.deps.store.config.get(AGENTS_KEY);
            if (Array.isArray(rawAgents)) {
                for (const a of rawAgents as AgentQualityProfile[]) {
                    this.agentProfiles.set(a.agentId, a);
                }
            }
        } catch { /* empty */ }
        this._loaded = true;
    }

    private async persist(): Promise<void> {
        try {
            await this.deps.store.config.set(SCORES_KEY, this.scores.slice(0, MAX_SCORES));
            await this.deps.store.config.set(AGENTS_KEY, [...this.agentProfiles.values()]);
        } catch (e) {
            LOGGER.warn('QualityBenchmark', 'Failed to persist quality scores', { error: String(e) });
        }
    }

    async score(session: DebateSession, verdict?: DebateVerdict): Promise<DebateQualityScore> {
        await this.load();

        const dimensions = [
            computeArgumentDepth(session),
            computeEngagementBalance(session),
            computeConsensusQuality(session, verdict),
            computeEfficiency(session),
            computeReasoningDiversity(session),
        ];

        const compositeScore = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / dimensions.reduce((sum, d) => sum + d.weight, 0);

        updateAgentProfile(this.agentProfiles, session);

        const allComposites = this.scores.map((s) => s.compositeScore);
        const percentile = computePercentile(compositeScore, allComposites);
        const trend = computeTrend(this.scores);

        const avgComposite = allComposites.length > 0
            ? allComposites.reduce((a, b) => a + b, 0) / allComposites.length
            : 0.5;

        const score: DebateQualityScore = {
            sessionId: session.id,
            topic: session.topic,
            compositeScore,
            dimensions,
            agentScores: Object.fromEntries(
                [...this.agentProfiles.entries()].filter(([id]) =>
                    session.arguments?.some((a) => a.agentId === id),
                ),
            ),
            benchmarks: {
                vsAverage: compositeScore - avgComposite,
                percentile,
                trend,
            },
            scoredAt: Date.now(),
        };

        this.scores.unshift(score);
        if (this.scores.length > MAX_SCORES) this.scores = this.scores.slice(0, MAX_SCORES);

        await this.persist();
        LOGGER.info('QualityBenchmark', 'Scored debate', {
            sessionId: session.id,
            composite: compositeScore.toFixed(3),
            percentile,
            trend,
        });

        return score;
    }

    getScores(limit = 50): DebateQualityScore[] {
        return this.scores.slice(0, limit);
    }

    getAgentProfile(agentId: string): AgentQualityProfile | undefined {
        return this.agentProfiles.get(agentId);
    }

    getAllAgentProfiles(): AgentQualityProfile[] {
        return [...this.agentProfiles.values()];
    }

    getTrend(period: 'day' | 'week' | 'month' = 'week'): QualityTrend {
        const now = Date.now();
        const periodMs = period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000;
        const periodScores = this.scores.filter((s) => now - s.scoredAt < periodMs);

        if (periodScores.length === 0) {
            return { period, avgComposite: 0, debateCount: 0, bestDimension: 'none', worstDimension: 'none', change: 0 };
        }

        const avgComposite = periodScores.reduce((s, x) => s + x.compositeScore, 0) / periodScores.length;

        const dimTotals = new Map<string, { sum: number; count: number }>();
        for (const s of periodScores) {
            for (const d of s.dimensions) {
                const existing = dimTotals.get(d.name) ?? { sum: 0, count: 0 };
                dimTotals.set(d.name, { sum: existing.sum + d.score, count: existing.count + 1 });
            }
        }
        let bestDim = 'none';
        let worstDim = 'none';
        let bestScore = -1;
        let worstScore = 2;
        for (const [name, { sum, count }] of dimTotals) {
            const avg = sum / count;
            if (avg > bestScore) { bestScore = avg; bestDim = name; }
            if (avg < worstScore) { worstScore = avg; worstDim = name; }
        }

        const half = Math.floor(periodScores.length / 2);
        const recentHalf = periodScores.slice(0, half);
        const olderHalf = periodScores.slice(half);
        const recentAvg = recentHalf.length > 0 ? recentHalf.reduce((s, x) => s + x.compositeScore, 0) / recentHalf.length : 0;
        const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((s, x) => s + x.compositeScore, 0) / olderHalf.length : 0;

        return {
            period,
            avgComposite,
            debateCount: periodScores.length,
            bestDimension: bestDim,
            worstDimension: worstDim,
            change: recentAvg - olderAvg,
        };
    }

    getLeaderboard(limit = 10): AgentQualityProfile[] {
        return [...this.agentProfiles.values()]
            .sort((a, b) => b.avgConfidence - a.avgConfidence)
            .slice(0, limit);
    }

    formatBenchmarkReport(): string {
        const trend = this.getTrend();
        const lines = [
            '## Debate Quality Benchmarks',
            '',
            `Period: ${trend.period} | Debates: ${trend.debateCount} | Avg Score: ${(trend.avgComposite * 100).toFixed(1)}%`,
            `Best dimension: ${trend.bestDimension} | Worst: ${trend.worstDimension}`,
            `Trend: ${trend.change > 0 ? '+' : ''}${(trend.change * 100).toFixed(1)}%`,
            '',
            '### Top Agents',
        ];
        for (const a of this.getLeaderboard(5)) {
            lines.push(`- ${a.agentId}: confidence ${(a.avgConfidence * 100).toFixed(0)}%, ${a.totalDebates} debates`);
        }
        return lines.join('\n');
    }
}
