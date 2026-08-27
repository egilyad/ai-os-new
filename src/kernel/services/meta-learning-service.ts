import type {
    IMetaLearningService,
    MetaLearningState,
    LearningSignal,
    LearnedPattern,
    LearningObservation,
} from '../contracts/meta-learning';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('MetaLearning');

let _oid = 0;
const genId = () => `obs-${++_oid}-${Date.now()}`;

export class MetaLearningService implements IMetaLearningService {
    private observations: LearningObservation[] = [];
    private patterns: LearnedPattern[] = [];
    private _learningRate = 0.1;
    private _explorationRate = 0.2;
    private adjustmentsApplied = 0;
    private correctPredictions = 0;
    private totalPredictions = 0;
    private _analyzeTimer: ReturnType<typeof setTimeout> | null = null;

    getState(): MetaLearningState {
        return {
            totalObservations: this.observations.length,
            patternsFound: this.patterns.length,
            adjustmentsApplied: this.adjustmentsApplied,
            learningRate: this._learningRate,
            explorationRate: this._explorationRate,
            recentPatterns: [...this.patterns].slice(-10),
            accuracy:
                this.totalPredictions > 0 ? this.correctPredictions / this.totalPredictions : 0,
        };
    }

    recordObservation(
        signal: LearningSignal,
        features: Record<string, number | string>,
        outcome: number,
    ): void {
        const obs: LearningObservation = {
            id: genId(),
            signal,
            features,
            outcome,
            timestamp: Date.now(),
            weight: 1.0,
        };
        this.observations.push(obs);
        this.observations = this.observations.slice(-10000); // keep last 10K
        this.scheduleAnalysis();
        LOGGER.info('MetaLearning', 'Observation recorded', { signal, outcome });
    }

    getSuggestions(): LearnedPattern[] {
        return this.patterns.filter((p) => p.confidence > 0.6 && p.impact !== 'neutral');
    }

    recordPrediction(wasCorrect: boolean): void {
        this.totalPredictions++;
        if (wasCorrect) this.correctPredictions++;
    }

    async applySuggestion(patternId: string): Promise<void> {
        const pattern = this.patterns.find((p) => p.id === patternId);
        if (!pattern) throw new Error(`Pattern ${patternId} not found`);
        this.adjustmentsApplied++;
        if (pattern.affectedParam === 'learningRate') {
            this._learningRate = Number(pattern.affectedValue);
        } else if (pattern.affectedParam === 'explorationRate') {
            this._explorationRate = Number(pattern.affectedValue);
        } else if (pattern.affectedParam === 'temperature' || pattern.affectedParam === 'model') {
            LOGGER.info('MetaLearning', 'Parameter requires external action', {
                param: pattern.affectedParam,
                value: pattern.affectedValue,
            });
        }
        pattern.timesApplied = (pattern.timesApplied || 0) + 1;
        this.recordPrediction(pattern.confidence > 0.7);
        LOGGER.info('MetaLearning', 'Suggestion applied', {
            pattern: pattern.description,
            param: pattern.affectedParam,
            value: pattern.affectedValue,
        });
    }

    setLearningRate(rate: number): void {
        this._learningRate = Math.max(0.01, Math.min(1, rate));
    }

    setExplorationRate(rate: number): void {
        this._explorationRate = Math.max(0, Math.min(1, rate));
    }

    private analyzePatterns(): void {
        if (this.observations.length < 10) return;

        const patterns: LearnedPattern[] = [];

        // Pattern: success by signal type
        const bySignal = new Map<LearningSignal, { successes: number; total: number }>();
        for (const obs of this.observations) {
            const entry = bySignal.get(obs.signal) || { successes: 0, total: 0 };
            entry.total++;
            if (obs.outcome > 0.5) entry.successes++;
            bySignal.set(obs.signal, entry);
        }
        for (const [signal, stats] of bySignal) {
            if (stats.total >= 5) {
                const rate = stats.successes / stats.total;
                patterns.push({
                    id: `pattern-signal-${signal}`,
                    description: `${signal} succeeds ${(rate * 100).toFixed(0)}% of the time`,
                    confidence: Math.min(1, stats.total / 50),
                    impact: rate > 0.7 ? 'positive' : rate < 0.3 ? 'negative' : 'neutral',
                    suggestedAction:
                        rate > 0.7
                            ? `Prioritize ${signal} operations`
                            : `Review ${signal} strategy`,
                    affectedParam: `signal_${signal}_weight`,
                    affectedValue: rate,
                    observationCount: stats.total,
                    lastUpdated: Date.now(),
                });
            }
        }

        // Pattern: time-of-day performance
        const byHour = new Map<number, { sum: number; count: number }>();
        for (const obs of this.observations) {
            const hour = new Date(obs.timestamp).getHours();
            const entry = byHour.get(hour) || { sum: 0, count: 0 };
            entry.sum += obs.outcome;
            entry.count++;
            byHour.set(hour, entry);
        }
        for (const [hour, stats] of byHour) {
            if (stats.count >= 3) {
                const avg = stats.sum / stats.count;
                if (Math.abs(avg - 0.5) > 0.2) {
                    patterns.push({
                        id: `pattern-hour-${hour}`,
                        description: `Peak performance at ${hour}:00 (avg ${(avg * 100).toFixed(0)}%)`,
                        confidence: Math.min(1, stats.count / 20),
                        impact: avg > 0.6 ? 'positive' : 'negative',
                        suggestedAction:
                            avg > 0.6
                                ? `Schedule important tasks around ${hour}:00`
                                : `Avoid critical operations at ${hour}:00`,
                        affectedParam: `time_weight_${hour}`,
                        affectedValue: avg,
                        observationCount: stats.count,
                        lastUpdated: Date.now(),
                    });
                }
            }
        }

        this.patterns = patterns;
    }

    destroy(): void {
        if (this._analyzeTimer) {
            clearTimeout(this._analyzeTimer);
            this._analyzeTimer = null;
        }
    }

    private scheduleAnalysis(): void {
        if (this._analyzeTimer) return;
        this._analyzeTimer = setTimeout(() => {
            this._analyzeTimer = null;
            this.analyzePatterns();
        }, 2_000);
    }
}
