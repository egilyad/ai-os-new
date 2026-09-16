/**
 * TrainingService — GAP E.3 (CrewAI `train` analogue + replay/test).
 *
 * Human feedback per role accumulates into TrainGuides (suggestions +
 * quality + runs); `guideFor()` renders mandatory instructions that the LLM
 * bridge appends to the role system prompt. `replayCrew()` resets tasks from
 * a given task onward and re-runs; `testCrew()` runs N times with a summary.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ParityRepository } from '../../dal/parity-repository';
import type { ICrewService } from '../../contracts/crew';
import type { ITrainingService } from '../../contracts/parity';
import type { TrainGuide } from '../../types/parity-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Training');

function now(): number {
    return Date.now();
}

export interface TrainingDeps {
    repo: ParityRepository;
    events: IEventBus;
    crewProvider: () => ICrewService;
}

export class TrainingService implements ITrainingService {
    private repo: ParityRepository;
    private events: IEventBus;
    private crewProvider: () => ICrewService;

    constructor(deps: TrainingDeps) {
        this.repo = deps.repo;
        this.events = deps.events;
        this.crewProvider = deps.crewProvider;
    }

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async recordFeedback(role: string, feedback: string, quality = 0.7): Promise<TrainGuide> {
        const existing = await this.repo.getGuideByRole(role);
        const t = now();
        const suggestion = feedback.trim().slice(0, 500);
        if (!existing) {
            const guide: TrainGuide = {
                id: genId('train'),
                role,
                suggestions: suggestion ? [suggestion] : [],
                quality: Math.max(0, Math.min(1, quality)),
                runs: 1,
                createdAt: t,
                updatedAt: t,
            };
            await this.repo.putGuide(guide);
            this.events.emit(EVENTS.TRAINING_RECORDED, { role, runs: 1, quality: guide.quality });
            return guide;
        }
        if (suggestion && !existing.suggestions.includes(suggestion)) {
            existing.suggestions.push(suggestion);
            if (existing.suggestions.length > 20) {
                existing.suggestions.splice(0, existing.suggestions.length - 20);
            }
        }
        existing.runs += 1;
        existing.quality = existing.quality * 0.7 + Math.max(0, Math.min(1, quality)) * 0.3;
        existing.updatedAt = t;
        await this.repo.putGuide(existing);
        this.events.emit(EVENTS.TRAINING_RECORDED, {
            role,
            runs: existing.runs,
            quality: existing.quality,
        });
        return existing;
    }

    async guideFor(role: string): Promise<string> {
        const guide = await this.repo.getGuideByRole(role);
        if (!guide || guide.suggestions.length === 0) return '';
        return (
            `Trained guidance for role "${role}" (quality ${guide.quality.toFixed(2)}, ` +
            `${guide.runs} feedback run(s)) — MANDATORY instructions:\n` +
            guide.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
        );
    }

    async listGuides(): Promise<TrainGuide[]> {
        return this.repo.listGuides();
    }

    async clearGuide(role: string): Promise<void> {
        const guide = await this.repo.getGuideByRole(role);
        if (guide) await this.repo.deleteGuide(guide.id);
    }

    /** CrewAI `replay` analogue: reset from a task onward, then run. */
    async replayCrew(crewId: string, fromTaskId?: string): Promise<string> {
        const crew = this.crewProvider();
        await crew.resetTasks(crewId, fromTaskId);
        const result = await crew.startCrew(crewId);
        return `Replay of ${crewId} → ${result.status} (${Object.keys(result.outputs).length} outputs)`;
    }

    /** CrewAI `test` analogue: N runs, pass/fail summary. */
    async testCrew(crewId: string, n = 3): Promise<string> {
        const crew = this.crewProvider();
        const runs = Math.max(1, Math.min(10, n));
        let passed = 0;
        for (let i = 0; i < runs; i++) {
            await crew.resetTasks(crewId);
            const result = await crew.startCrew(crewId);
            if (result.status === 'completed') passed += 1;
            if (result.status === 'paused') break;
        }
        return `Test of ${crewId}: ${passed}/${runs} completed`;
    }
}
