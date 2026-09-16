import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from './logger-service';
import { BucketStorageAdapter } from './storage-adapter';
import { getTechniques } from './debate-runtime/quality-settings-store';
import { EVENTS } from '../events/event-names';
import type {
    QualityImpactEvent,
    TechniqueImpactMetrics,
    QualitySessionRecord,
    QualityBaselineRecord,
    IQualityImpactCollector,
    BestConditions,
    SessionScoreSnapshot,
    AttributionEntry,
} from '../contracts/quality-impact';

const LOGGER = rootLogger.child('QualityImpactCollector');

const STORAGE_PREFIX = 'quality-metrics-';
const SESSION_PREFIX = 'quality-session-';
const BASELINE_PREFIX = 'quality-baseline-';
const STORAGE_KEY_SNAPSHOTS = 'quality-snapshots';
const STORAGE_KEY_SESSION_INDEX = 'quality-sessions-index';
const STORAGE_KEY_BASELINE_INDEX = 'quality-baselines-index';

const SNAP_MAX = 500;

function studentTCdf(t: number, df: number): number {
    const x = df / (df + t * t);
    let p = 1 - 0.5 * Math.pow(x, df / 2);
    for (let i = 2; i < df; i += 2) {
        p -=
            (gamma(i / 2 + 0.5) / (Math.sqrt(Math.PI) * gamma(i / 2))) *
            Math.pow(x, i / 2) *
            (t > 0 ? 1 : -1);
    }
    return Math.max(0, Math.min(1, p));
}

function gamma(z: number): number {
    const g = 7;
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = c[0]!;
    for (let i = 1; i < g + 2; i++) x += c[i]! / (z + i);
    const tt = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(tt, z + 0.5) * Math.exp(-tt) * x;
}

function computeWelchPValue(
    sampleOn: number[],
    sampleOff: number[],
): { pValue: number; confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high' } {
    const nOn = sampleOn.length;
    const nOff = sampleOff.length;
    if (nOn < 2 || nOff < 2) return { pValue: 1, confidence: 'none' };

    const meanOn = sampleOn.reduce((a, b) => a + b, 0) / nOn;
    const meanOff = sampleOff.reduce((a, b) => a + b, 0) / nOff;
    const varOn = sampleOn.reduce((s, x) => s + (x - meanOn) ** 2, 0) / (nOn - 1);
    const varOff = sampleOff.reduce((s, x) => s + (x - meanOff) ** 2, 0) / (nOff - 1);

    const se = Math.sqrt(varOn / nOn + varOff / nOff);
    if (se === 0) return { pValue: 1, confidence: 'none' };

    const t = (meanOn - meanOff) / se;
    const df =
        (varOn / nOn + varOff / nOff) ** 2 /
        ((varOn / nOn) ** 2 / (nOn - 1) + (varOff / nOff) ** 2 / (nOff - 1));

    const p = studentTCdf(t, Math.max(1, Math.round(df)));

    if (p < 0.001) return { pValue: p, confidence: 'very_high' };
    if (p < 0.01) return { pValue: p, confidence: 'high' };
    if (p < 0.05) return { pValue: p, confidence: 'medium' };
    if (p < 0.1) return { pValue: p, confidence: 'low' };
    return { pValue: p, confidence: 'none' };
}

function findBestRoundRange(scores: number[], rounds: number[]): [number, number] | undefined {
    if (scores.length < 3) return undefined;
    let bestStart = 0;
    let bestEnd = 0;
    let bestAvg = -Infinity;
    for (let i = 0; i < scores.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, scores.length); j++) {
            const slice = scores.slice(i, j + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestStart = rounds[i]!;
                bestEnd = rounds[j]!;
            }
        }
    }
    return bestAvg > -Infinity ? [bestStart, bestEnd] : undefined;
}

export class QualityImpactCollector implements IQualityImpactCollector, ILifecycle {
    private readonly _eventBus: IEventBus | null;
    private sessionBuffers = new Map<string, QualityImpactEvent[]>();
    private aggregatedMetrics = new Map<string, TechniqueImpactMetrics>();
    private sessionHistory: QualitySessionRecord[] = [];
    private baselineSessions: QualityBaselineRecord[] = [];
    private scoreSnapshots: SessionScoreSnapshot[] = [];

    constructor(eventBus?: IEventBus) {
        this._eventBus = eventBus ?? null;
    }

    async init(): Promise<void> {
        await this.loadPersistedMetrics();
        await this.loadSessionHistory();
        await this.loadBaselineSessions();
        await this.loadScoreSnapshots();
        LOGGER.info('QualityImpactCollector', 'init', {
            metricsLoaded: this.aggregatedMetrics.size,
            historyLoaded: this.sessionHistory.length,
            baselinesLoaded: this.baselineSessions.length,
        });
    }

    destroy(): void {
        this.sessionBuffers.clear();
        this.aggregatedMetrics.clear();
        this.sessionHistory = [];
        this.baselineSessions = [];
        this.scoreSnapshots = [];
    }

    record(event: QualityImpactEvent): void {
        let buf = this.sessionBuffers.get(event.sessionId);
        if (!buf) {
            buf = [];
            this.sessionBuffers.set(event.sessionId, buf);
        }
        buf.push(event);
        // Emit live event for real-time UI indicators
        try {
            this._eventBus?.emit(EVENTS.DEBATE_QUALITY_TECHNIQUE_APPLIED, {
                sessionId: event.sessionId,
                techniqueId: event.techniqueId,
                eventType: event.eventType,
                round: event.round,
                agentId: event.agentId,
                timestamp: event.timestamp,
            });
        } catch {
            /* event bus may not be ready */
        }
    }

    async finalizeSession(
        sessionId: string,
        sessionData: {
            enabledTechniques: string[];
            topic: string;
            strategy: string;
            participantCount: number;
            roundCount: number;
            totalTokens: number;
            durationMs: number;
            judgeScore?: number;
        },
    ): Promise<void> {
        const events = this.sessionBuffers.get(sessionId);
        if (!events || events.length === 0) {
            LOGGER.debug('QualityImpactCollector', 'finalizeSession: no events', { sessionId });
            return;
        }

        const judgeScore = sessionData.judgeScore ?? 0;
        const techniqueEvents = this.groupByTechnique(events);
        const activated = Array.from(techniqueEvents.keys());

        const record: QualitySessionRecord = {
            sessionId,
            topic: sessionData.topic,
            strategy: sessionData.strategy,
            participantCount: sessionData.participantCount,
            roundCount: sessionData.roundCount,
            totalTokens: sessionData.totalTokens,
            durationMs: sessionData.durationMs,
            enabledTechniques: sessionData.enabledTechniques,
            activatedTechniques: activated,
            techniqueEventCount: events.length,
            timestamp: Date.now(),
        };
        this.sessionHistory.push(record);
        await this.persistSessionRecord(record);

        const isBaseline = sessionData.enabledTechniques.length === 0;
        if (isBaseline) {
            const bl: QualityBaselineRecord = {
                sessionId,
                topic: sessionData.topic,
                strategy: sessionData.strategy,
                participantCount: sessionData.participantCount,
                roundCount: sessionData.roundCount,
                totalTokens: sessionData.totalTokens,
                durationMs: sessionData.durationMs,
                judgeScore,
                avgConfidence: 0.5,
                timestamp: Date.now(),
            };
            this.baselineSessions.push(bl);
            await this.persistBaselineRecord(bl);
        }

        const snap: SessionScoreSnapshot = {
            sessionId,
            enabledTechniques: sessionData.enabledTechniques,
            judgeScore,
            avgConfidence: 0.5,
            roundCount: sessionData.roundCount,
            totalTokens: sessionData.totalTokens,
            participantCount: sessionData.participantCount,
            strategy: sessionData.strategy,
            topic: sessionData.topic,
            durationMs: sessionData.durationMs,
            timestamp: Date.now(),
        };
        this.scoreSnapshots.push(snap);
        if (this.scoreSnapshots.length > SNAP_MAX) {
            this.scoreSnapshots = this.scoreSnapshots.slice(-SNAP_MAX);
        }
        await this.persistScoreSnapshots();

        const baselineAvg = this.computeBaselineAvg(judgeScore);

        for (const [techId, techEvents] of techniqueEvents) {
            const existing = this.aggregatedMetrics.get(techId) || this.emptyMetrics(techId);
            const onCount = techEvents.filter((e) => e.eventType !== 'FINAL_IMPACT').length;
            const delta = judgeScore - baselineAvg;

            const allOnScores = this.scoreSnapshots
                .filter((s) => s.enabledTechniques.includes(techId))
                .map((s) => s.judgeScore);
            const allOffScores = this.scoreSnapshots
                .filter(
                    (s) => !s.enabledTechniques.includes(techId) && s.enabledTechniques.length > 0,
                )
                .map((s) => s.judgeScore);

            const sig =
                allOnScores.length >= 2 && allOffScores.length >= 2
                    ? computeWelchPValue(allOnScores, allOffScores)
                    : { pValue: 1, confidence: 'none' as const };

            const totalOn = existing.sampleSizeOn + 1;
            const newDelta =
                (existing.avgJudgeScoreDelta * existing.sampleSizeOn + delta) / totalOn;

            this.aggregatedMetrics.set(techId, {
                ...existing,
                totalSessions: existing.totalSessions + 1,
                totalActivations: existing.totalActivations + onCount,
                totalSkips:
                    existing.totalSkips +
                    Math.max(0, sessionData.enabledTechniques.length - onCount),
                avgJudgeScoreDelta: isFinite(newDelta) ? newDelta : 0,
                sampleSizeOn: allOnScores.length || 1,
                sampleSizeOff: allOffScores.length || 0,
                confidence: sig.confidence,
                pValue: sig.pValue,
                lastUpdated: Date.now(),
            });
        }

        // Layer 1: Last-touch attribution — which technique fired last before score improvement
        const lastTouch = this.computeLastTouch(events);
        if (lastTouch) {
            const ltMetrics = this.aggregatedMetrics.get(lastTouch);
            if (ltMetrics) {
                this.aggregatedMetrics.set(lastTouch, {
                    ...ltMetrics,
                    lastTouchCount: ltMetrics.lastTouchCount + 1,
                });
            }
        }

        // Track avgConfidenceDelta from SCORE_CHANGED events
        const confidenceDeltas: number[] = [];
        for (const [, techEvents] of techniqueEvents) {
            for (const e of techEvents) {
                if (e.eventType === 'SCORE_CHANGED') {
                    const p = e.payload as { delta?: number; dimension?: string };
                    if (typeof p.delta === 'number') confidenceDeltas.push(p.delta);
                }
            }
        }
        if (confidenceDeltas.length > 0) {
            const avgConf = confidenceDeltas.reduce((s, d) => s + d, 0) / confidenceDeltas.length;
            for (const metrics of this.aggregatedMetrics.values()) {
                metrics.avgConfidenceDelta =
                    (metrics.avgConfidenceDelta * metrics.totalSessions + avgConf) /
                    (metrics.totalSessions + 1);
            }
        }

        await this.persistAllMetrics();

        // Layer 2: Frequency attribution — recompute across top-25% sessions
        this.recomputeFrequencyAttribution();

        this.printReport(sessionId, techniqueEvents);
        // Emit impact computed for real-time UI
        try {
            const totalDelta = Array.from(this.aggregatedMetrics.values()).reduce(
                (s, m) => s + m.avgJudgeScoreDelta,
                0,
            );
            this._eventBus?.emit(EVENTS.DEBATE_QUALITY_IMPACT_COMPUTED, {
                sessionId,
                techniqueCount: techniqueEvents.size,
                techniqueDelta: totalDelta,
                timestamp: Date.now(),
            });
        } catch {
            /* event bus may not be ready */
        }
        this.sessionBuffers.delete(sessionId);
    }

    getMetrics(techniqueId: string): TechniqueImpactMetrics | undefined {
        return this.aggregatedMetrics.get(techniqueId);
    }

    getAllMetrics(): TechniqueImpactMetrics[] {
        return Array.from(this.aggregatedMetrics.values());
    }

    getSessionHistory(): QualitySessionRecord[] {
        return [...this.sessionHistory];
    }

    getBaselineSessions(): QualityBaselineRecord[] {
        return [...this.baselineSessions];
    }

    getBestConditions(techniqueId: string): BestConditions {
        const metric = this.aggregatedMetrics.get(techniqueId);
        if (!metric) {
            return { techniqueId, confidence: 'none' };
        }

        const sessionsWithTech = this.scoreSnapshots.filter((s) =>
            s.enabledTechniques.includes(techniqueId),
        );

        if (sessionsWithTech.length < 2) {
            return { techniqueId, confidence: metric.confidence };
        }

        const bestRoundRange = findBestRoundRange(
            sessionsWithTech.map((s) => s.judgeScore),
            sessionsWithTech.map((s) => s.roundCount),
        );

        const participantCounts = sessionsWithTech.map((s) => s.participantCount);
        const bestAgentCount =
            participantCounts.length > 0
                ? Math.round(
                      participantCounts.reduce((a, b) => a + b, 0) / participantCounts.length,
                  )
                : undefined;

        return {
            techniqueId,
            bestRoundRange,
            bestAgentCount,
            confidence: metric.confidence,
        };
    }

    getSignificance(techniqueId: string): {
        pValue: number;
        confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
    } {
        const metric = this.aggregatedMetrics.get(techniqueId);
        if (!metric) return { pValue: 1, confidence: 'none' };

        if (metric.pValue !== undefined) {
            return { pValue: metric.pValue, confidence: metric.confidence };
        }

        const onScores = this.scoreSnapshots
            .filter((s) => s.enabledTechniques.includes(techniqueId))
            .map((s) => s.judgeScore);
        const offScores = this.scoreSnapshots
            .filter(
                (s) => !s.enabledTechniques.includes(techniqueId) && s.enabledTechniques.length > 0,
            )
            .map((s) => s.judgeScore);

        if (onScores.length < 2 || offScores.length < 2) {
            return { pValue: 1, confidence: 'none' };
        }

        return computeWelchPValue(onScores, offScores);
    }

    getScoreSnapshots(): SessionScoreSnapshot[] {
        return [...this.scoreSnapshots];
    }

    private computeBaselineAvg(currentScore: number): number {
        if (this.baselineSessions.length === 0) return currentScore;
        const total = this.baselineSessions.reduce((s, b) => s + b.judgeScore, 0);
        return total / this.baselineSessions.length;
    }

    private groupByTechnique(events: QualityImpactEvent[]): Map<string, QualityImpactEvent[]> {
        const groups = new Map<string, QualityImpactEvent[]>();
        for (const e of events) {
            let g = groups.get(e.techniqueId);
            if (!g) {
                g = [];
                groups.set(e.techniqueId, g);
            }
            g.push(e);
        }
        return groups;
    }

    private emptyMetrics(techniqueId: string): TechniqueImpactMetrics {
        return {
            techniqueId,
            totalSessions: 0,
            totalActivations: 0,
            totalSkips: 0,
            avgJudgeScoreDelta: 0,
            avgConfidenceDelta: 0,
            avgRoundCountDelta: 0,
            avgTokenCostDelta: 0,
            sampleSizeOn: 0,
            sampleSizeOff: 0,
            confidence: 'none',
            lastTouchCount: 0,
            frequencyInBestRounds: 0,
            lastUpdated: Date.now(),
        };
    }

    private computeLastTouch(events: QualityImpactEvent[]): string | null {
        for (let i = events.length - 1; i >= 0; i--) {
            const e = events[i]!;
            if (e.eventType === 'SCORE_CHANGED' || e.eventType === 'FINAL_IMPACT') {
                return e.techniqueId;
            }
        }
        return null;
    }

    private recomputeFrequencyAttribution(): void {
        const topFraction = 0.25;
        const sorted = [...this.scoreSnapshots]
            .filter((s) => s.enabledTechniques.length > 0)
            .sort((a, b) => b.judgeScore - a.judgeScore);
        if (sorted.length === 0) return;

        const topCount = Math.max(1, Math.round(sorted.length * topFraction));
        const topSessions = sorted.slice(0, topCount);

        const techniqueFrequency = new Map<string, number>();
        for (const s of topSessions) {
            for (const techId of s.enabledTechniques) {
                techniqueFrequency.set(techId, (techniqueFrequency.get(techId) ?? 0) + 1);
            }
        }

        for (const [techId, metrics] of this.aggregatedMetrics) {
            const freq = (techniqueFrequency.get(techId) ?? 0) / topCount;
            this.aggregatedMetrics.set(techId, {
                ...metrics,
                frequencyInBestRounds: freq,
            });
        }
    }

    getAttribution(): AttributionEntry[] {
        return this.getAllMetrics().map((m) => ({
            techniqueId: m.techniqueId,
            lastTouchCount: m.lastTouchCount ?? 0,
            frequencyInBestRounds: m.frequencyInBestRounds ?? 0,
            compositeScore: (m.lastTouchCount ?? 0) * 2 + (m.frequencyInBestRounds ?? 0) * 100,
        }));
    }

    getAttributionLeaderboard(limit?: number): AttributionEntry[] {
        const all = this.getAttribution().sort((a, b) => b.compositeScore - a.compositeScore);
        return limit ? all.slice(0, limit) : all;
    }

    private printReport(
        sessionId: string,
        techniqueEvents: Map<string, QualityImpactEvent[]>,
    ): void {
        const sorted = Array.from(techniqueEvents.entries())
            .map(([techId, events]) => ({
                techId,
                count: events.filter((e) => e.eventType !== 'FINAL_IMPACT').length,
                metric: this.aggregatedMetrics.get(techId),
            }))
            .sort(
                (a, b) => (b.metric?.avgJudgeScoreDelta ?? 0) - (a.metric?.avgJudgeScoreDelta ?? 0),
            );

        LOGGER.info('QualityImpactCollector', `Session ${sessionId}: ${sorted.length} techniques`);
        for (const entry of sorted) {
            const m = entry.metric;
            if (!m) continue;
            const sign = m.avgJudgeScoreDelta >= 0 ? '+' : '';
            LOGGER.info(
                'QualityImpactCollector',
                `${entry.techId}: ${sign}${(m.avgJudgeScoreDelta * 100).toFixed(1)}%`,
                {
                    n: entry.count,
                    sessions: m.totalSessions,
                    pValue: m.pValue?.toFixed(4) ?? 'N/A',
                    confidence: m.confidence,
                },
            );
        }
    }

    private async persistSessionRecord(record: QualitySessionRecord): Promise<void> {
        try {
            await BucketStorageAdapter.UI.set(`${SESSION_PREFIX}${record.sessionId}`, record);
            // Update session index
            const index =
                (await BucketStorageAdapter.UI.get<string[]>(STORAGE_KEY_SESSION_INDEX)) ?? [];
            if (!index.includes(record.sessionId)) {
                index.push(record.sessionId);
                if (index.length > 500) index.splice(0, index.length - 500);
                await BucketStorageAdapter.UI.set(STORAGE_KEY_SESSION_INDEX, index);
            }
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'persistSessionRecord failed', {
                sessionId: record.sessionId,
                error: String(e),
            });
        }
    }

    private async persistBaselineRecord(record: QualityBaselineRecord): Promise<void> {
        try {
            await BucketStorageAdapter.UI.set(`${BASELINE_PREFIX}${record.sessionId}`, record);
            const index =
                (await BucketStorageAdapter.UI.get<string[]>(STORAGE_KEY_BASELINE_INDEX)) ?? [];
            if (!index.includes(record.sessionId)) {
                index.push(record.sessionId);
                if (index.length > 200) index.splice(0, index.length - 200);
                await BucketStorageAdapter.UI.set(STORAGE_KEY_BASELINE_INDEX, index);
            }
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'persistBaselineRecord failed', {
                sessionId: record.sessionId,
                error: String(e),
            });
        }
    }

    private async persistAllMetrics(): Promise<void> {
        for (const [techId, metrics] of this.aggregatedMetrics) {
            try {
                await BucketStorageAdapter.UI.set(`${STORAGE_PREFIX}${techId}`, metrics);
            } catch (e) {
                LOGGER.warn('QualityImpactCollector', 'persistMetrics failed', {
                    techniqueId: techId,
                    error: String(e),
                });
            }
        }
    }

    private async persistScoreSnapshots(): Promise<void> {
        try {
            await BucketStorageAdapter.UI.set(STORAGE_KEY_SNAPSHOTS, this.scoreSnapshots);
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'persistScoreSnapshots failed', {
                error: String(e),
            });
        }
    }

    private async loadPersistedMetrics(): Promise<void> {
        this.aggregatedMetrics.clear();
        try {
            const techniques = getTechniques();
            let loaded = 0;
            for (const t of techniques) {
                const stored = await BucketStorageAdapter.UI.get<TechniqueImpactMetrics>(
                    `${STORAGE_PREFIX}${t.id}`,
                );
                if (stored) {
                    this.aggregatedMetrics.set(t.id, {
                        ...stored,
                        lastTouchCount: stored.lastTouchCount ?? 0,
                        frequencyInBestRounds: stored.frequencyInBestRounds ?? 0,
                    });
                    loaded++;
                }
            }
            LOGGER.debug('QualityImpactCollector', 'loadPersistedMetrics', { loaded });
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'loadPersistedMetrics failed', {
                error: String(e),
            });
        }
    }

    private async loadSessionHistory(): Promise<void> {
        this.sessionHistory = [];
        try {
            const index = await BucketStorageAdapter.UI.get<string[]>(STORAGE_KEY_SESSION_INDEX);
            if (!index || index.length === 0) return;
            let loaded = 0;
            for (const sid of index) {
                const stored = await BucketStorageAdapter.UI.get<QualitySessionRecord>(
                    `${SESSION_PREFIX}${sid}`,
                );
                if (stored) {
                    this.sessionHistory.push(stored);
                    loaded++;
                }
            }
            LOGGER.debug('QualityImpactCollector', 'loadSessionHistory', {
                loaded,
                total: index.length,
            });
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'loadSessionHistory failed', {
                error: String(e),
            });
        }
    }

    private async loadBaselineSessions(): Promise<void> {
        this.baselineSessions = [];
        try {
            const index = await BucketStorageAdapter.UI.get<string[]>(STORAGE_KEY_BASELINE_INDEX);
            if (!index || index.length === 0) return;
            let loaded = 0;
            for (const sid of index) {
                const stored = await BucketStorageAdapter.UI.get<QualityBaselineRecord>(
                    `${BASELINE_PREFIX}${sid}`,
                );
                if (stored) {
                    this.baselineSessions.push(stored);
                    loaded++;
                }
            }
            LOGGER.debug('QualityImpactCollector', 'loadBaselineSessions', {
                loaded,
                total: index.length,
            });
        } catch (e) {
            LOGGER.warn('QualityImpactCollector', 'loadBaselineSessions failed', {
                error: String(e),
            });
        }
    }

    private async loadScoreSnapshots(): Promise<void> {
        try {
            const raw =
                await BucketStorageAdapter.UI.get<SessionScoreSnapshot[]>(STORAGE_KEY_SNAPSHOTS);
            if (raw) this.scoreSnapshots = raw;
        } catch {
            this.scoreSnapshots = [];
        }
    }
}
