import type {
    Tutorial,
    TutorialProgress,
    ITutorialService,
    TutorialStep,
} from '../contracts/tutorial';
import { BUILTIN_TUTORIALS } from './tutorial-definitions';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { rootLogger } from './logger-service';

export class TutorialService implements ITutorialService {
    private tutorials: Map<string, Tutorial> = new Map();
    private progress: Map<string, TutorialProgress> = new Map();
    private storageKey = 'tutorial_progress';
    private _initialized = false;

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        for (const t of BUILTIN_TUTORIALS) {
            this.tutorials.set(t.id, t);
        }
        this.loadProgress();
    }

    async start(): Promise<void> {}

    async destroy(): Promise<void> {
        this._initialized = false;
        this.saveProgress();
        this.tutorials.clear();
        this.progress.clear();
    }

    getTutorials(): Tutorial[] {
        return Array.from(this.tutorials.values());
    }

    getTutorial(id: string): Tutorial | undefined {
        return this.tutorials.get(id);
    }

    getProgress(tutorialId: string): TutorialProgress {
        const existing = this.progress.get(tutorialId);
        if (existing) return existing;
        return { tutorialId, completedSteps: [], startedAt: 0, completedAt: null };
    }

    getAllProgress(): TutorialProgress[] {
        return Array.from(this.progress.values());
    }

    startTutorial(tutorialId: string): void {
        const t = this.tutorials.get(tutorialId);
        if (!t) return;
        const prog = this.getProgress(tutorialId);
        if (prog.completedAt !== null) return;
        prog.startedAt = Date.now();
        this.progress.set(tutorialId, prog);
        this.saveProgress();
    }

    completeStep(tutorialId: string, stepId: string): void {
        const t = this.tutorials.get(tutorialId);
        if (!t) return;
        const validStep = t.steps.find((s) => s.id === stepId);
        if (!validStep) return;
        const prog = this.getProgress(tutorialId);
        if (prog.completedSteps.includes(stepId)) return;
        if (prog.startedAt === 0) prog.startedAt = Date.now();
        prog.completedSteps.push(stepId);
        this.progress.set(tutorialId, prog);

        if (this.isTutorialCompleted(tutorialId)) {
            prog.completedAt = Date.now();
        }
        this.saveProgress();
    }

    skipStep(tutorialId: string, stepId: string): void {
        const t = this.tutorials.get(tutorialId);
        if (!t) return;
        const validStep = t.steps.find((s) => s.id === stepId);
        if (!validStep) return;
        const prog = this.getProgress(tutorialId);
        if (prog.skippedSteps?.includes(stepId) || prog.completedSteps.includes(stepId)) return;
        if (prog.startedAt === 0) prog.startedAt = Date.now();
        if (!prog.skippedSteps) prog.skippedSteps = [];
        prog.skippedSteps.push(stepId);
        this.progress.set(tutorialId, prog);

        if (this.isTutorialCompleted(tutorialId)) {
            prog.completedAt = Date.now();
        }
        this.saveProgress();
    }

    completeTutorial(tutorialId: string): void {
        const t = this.tutorials.get(tutorialId);
        if (!t) return;
        const prog = this.getProgress(tutorialId);
        prog.completedSteps = t.steps.map((s) => s.id);
        prog.completedAt = Date.now();
        if (prog.startedAt === 0) prog.startedAt = Date.now();
        this.progress.set(tutorialId, prog);
        this.saveProgress();
    }

    resetTutorial(tutorialId: string): void {
        this.progress.delete(tutorialId);
        this.saveProgress();
    }

    isStepCompleted(tutorialId: string, stepId: string): boolean {
        return this.getProgress(tutorialId).completedSteps.includes(stepId);
    }

    isTutorialCompleted(tutorialId: string): boolean {
        const t = this.tutorials.get(tutorialId);
        if (!t) return false;
        const prog = this.getProgress(tutorialId);
        return t.steps.every((s) => prog.completedSteps.includes(s.id));
    }

    getNextIncomplete(tutorialId: string): TutorialStep | null {
        const t = this.tutorials.get(tutorialId);
        if (!t) return null;
        const prog = this.getProgress(tutorialId);
        for (const step of t.steps) {
            if (!prog.completedSteps.includes(step.id)) return step;
        }
        return null;
    }

    getOverallProgress(): number {
        const tutorials = this.getTutorials();
        if (tutorials.length === 0) return 0;
        let total = 0;
        let completed = 0;
        for (const t of tutorials) {
            const prog = this.getProgress(t.id);
            total += t.steps.length;
            completed += prog.completedSteps.length;
        }
        return total > 0 ? Math.round((completed / total) * 100) : 100;
    }

    isOnboardingComplete(): boolean {
        const required = this.getTutorials().filter((t) => t.required);
        return required.every((t) => this.isTutorialCompleted(t.id));
    }

    private loadProgress(): void {
        try {
            const raw = ssrSafeStorage.getItem(this.storageKey);
            if (raw) {
                const data = JSON.parse(raw) as TutorialProgress[];
                for (const p of data) {
                    this.progress.set(p.tutorialId, p);
                }
            }
        } catch (e) {
            rootLogger.warn('TutorialService', 'Failed to load progress', { error: e });
        }
    }

    private saveProgress(): void {
        try {
            ssrSafeStorage.setItem(
                this.storageKey,
                JSON.stringify(Array.from(this.progress.values())),
            );
        } catch (e) {
            rootLogger.warn('TutorialService', 'Failed to save progress', { error: e });
        }
    }
}
