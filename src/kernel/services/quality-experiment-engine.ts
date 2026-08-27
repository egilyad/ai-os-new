import { ssrSafeStorage } from '../utils/ssr-storage';
import type { QualityExperiment, IExperimentEngine } from '../contracts/quality-impact';
import { setSetting } from './debate-runtime/quality-settings-store';
import { rootLogger } from './logger-service';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { SeededRng } from '../utils/seedable-rng';

const LOGGER = rootLogger.child('ExperimentEngine');

const STORAGE_KEY = 'quality-experiments';
const ASSIGNMENT_KEY_PREFIX = 'experiment-assignment-';

let _rng = new SeededRng();

export function resetExperimentRng(seed?: number): void {
    _rng = new SeededRng(seed);
}

export class ExperimentEngine implements IExperimentEngine {
    private readonly _eventBus: IEventBus | null;
    private experiments: QualityExperiment[] = [];
    private initialized = false;

    constructor(eventBus?: IEventBus) {
        this._eventBus = eventBus ?? null;
    }

    async init(): Promise<void> {
        if (this.initialized) return;
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.experiments = JSON.parse(raw) as QualityExperiment[];
            }
        } catch {
            this.experiments = [];
        }
        this.initialized = true;
        LOGGER.info('ExperimentEngine', 'init', { count: this.experiments.length });
    }

    async startExperiment(config: {
        techniqueIds: string[];
        name?: string;
        enabledOnInit?: boolean;
    }): Promise<string> {
        const id = crypto.randomUUID();
        const experiment: QualityExperiment = {
            id,
            name: config.name ?? `Experiment ${this.experiments.length + 1}`,
            description: `A/B experiment for ${config.techniqueIds.length} techniques`,
            techniqueIds: config.techniqueIds,
            enabledOnInit: config.enabledOnInit ?? true,
            sessionsPlanned: 10,
            sessionsCompleted: 0,
            status: 'running',
            createdAt: Date.now(),
        };
        this.experiments.push(experiment);
        await this.persist();
        LOGGER.info('ExperimentEngine', 'startExperiment', {
            id,
            techniques: config.techniqueIds.length,
        });
        return id;
    }

    async stopExperiment(experimentId: string): Promise<void> {
        const exp = this.experiments.find((e) => e.id === experimentId);
        if (!exp) {
            LOGGER.warn('ExperimentEngine', 'stopExperiment: not found', { experimentId });
            return;
        }
        exp.status = 'completed';
        await this.persist();
        // Emit experiment completed event
        try {
            this._eventBus?.emit(EVENTS.DEBATE_QUALITY_EXPERIMENT_COMPLETED, {
                experimentId,
                techniqueIds: exp.techniqueIds,
                sessionsCompleted: exp.sessionsCompleted,
                timestamp: Date.now(),
            });
        } catch {
            /* event bus may not be ready */
        }

        // Reset all technique settings to defaults after experiment ends
        for (const techId of exp.techniqueIds) {
            setSetting(techId, true);
        }
        LOGGER.info('ExperimentEngine', 'stopExperiment', { experimentId });
    }

    async deleteExperiment(experimentId: string): Promise<void> {
        const idx = this.experiments.findIndex((e) => e.id === experimentId);
        if (idx < 0) {
            LOGGER.warn('ExperimentEngine', 'deleteExperiment: not found', { experimentId });
            return;
        }
        this.experiments.splice(idx, 1);
        await this.persist();
        LOGGER.info('ExperimentEngine', 'deleteExperiment', { experimentId });
    }

    getExperiment(id: string): QualityExperiment | undefined {
        return this.experiments.find((e) => e.id === id);
    }

    getAllExperiments(): QualityExperiment[] {
        return [...this.experiments];
    }

    isExperimentRunning(): boolean {
        return this.experiments.some((e) => e.status === 'running');
    }

    getAssignmentForSession(sessionId: string): Record<string, boolean> | undefined {
        try {
            const raw = ssrSafeStorage.getItem(`${ASSIGNMENT_KEY_PREFIX}${sessionId}`);
            if (raw) return JSON.parse(raw) as Record<string, boolean>;
        } catch {
            // not found
        }
        return undefined;
    }

    async recordSessionCompletion(
        sessionId: string,
        techniqueResults: Record<string, number>,
    ): Promise<void> {
        const running = this.experiments.filter((e) => e.status === 'running');
        if (running.length === 0) return;

        // Find which experiment this session belongs to by checking technique overlap
        const assignment = this.getAssignmentForSession(sessionId);
        if (!assignment) {
            LOGGER.debug('ExperimentEngine', 'recordSessionCompletion: no assignment', {
                sessionId,
            });
            return;
        }

        for (const exp of running) {
            const matched = exp.techniqueIds.filter((t) => assignment[t] !== undefined);
            if (matched.length === 0) continue;

            exp.sessionsCompleted++;
            const techResults = matched.map((t) => ({
                techniqueId: t,
                avgScoreOn: techniqueResults[t] ?? 0,
                avgScoreOff: 0,
                sessionsOn: assignment[t] ? 1 : 0,
                sessionsOff: assignment[t] ? 0 : 1,
                confidence: 'none' as const,
            }));

            exp.result = {
                techniqueResults: [...(exp.result?.techniqueResults ?? []), ...techResults],
            };
        }

        await this.persist();
        ssrSafeStorage.removeItem(`${ASSIGNMENT_KEY_PREFIX}${sessionId}`);
    }

    generateAssignmentForSession(
        sessionId: string,
        enabledTechniques: string[],
    ): Record<string, boolean> {
        const running = this.experiments.filter((e) => e.status === 'running');
        if (running.length === 0) return {};

        const assignment: Record<string, boolean> = {};

        for (const exp of running) {
            const relevant = exp.techniqueIds.filter((t) => enabledTechniques.includes(t));
            for (const techId of relevant) {
                // Random ON/OFF with 50% probability
                assignment[techId] = _rng.chance(0.5);
            }
        }

        // Apply assignment to settings store
        for (const [techId, enabled] of Object.entries(assignment)) {
            setSetting(techId, enabled);
        }

        // Persist assignment for this session
        try {
            ssrSafeStorage.setItem(
                `${ASSIGNMENT_KEY_PREFIX}${sessionId}`,
                JSON.stringify(assignment),
            );
        } catch {
            LOGGER.warn('ExperimentEngine', 'generateAssignment: persist failed', { sessionId });
        }

        return assignment;
    }

    destroy(): void {
        this.initialized = false;
        this.experiments = [];
    }

    private async persist(): Promise<void> {
        try {
            ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify(this.experiments));
        } catch {
            LOGGER.warn('ExperimentEngine', 'persist failed');
        }
    }
}
