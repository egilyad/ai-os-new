import type { ILifecycle } from './lifecycle';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    targetSelector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: string;
    route?: string;
    prerequisite?: string;
    image?: string;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: string;
    steps: TutorialStep[];
    required?: boolean;
    estimatedMinutes: number;
    category: 'getting_started' | 'providers' | 'debates' | 'memory' | 'advanced';
}

export interface TutorialProgress {
    tutorialId: string;
    completedSteps: string[];
    skippedSteps?: string[];
    startedAt: number;
    completedAt: number | null;
}

export interface ITutorialService extends ILifecycle {
    getTutorials(): Tutorial[];
    getTutorial(id: string): Tutorial | undefined;
    getProgress(tutorialId: string): TutorialProgress;
    getAllProgress(): TutorialProgress[];
    startTutorial(tutorialId: string): void;
    completeStep(tutorialId: string, stepId: string): void;
    skipStep(tutorialId: string, stepId: string): void;
    completeTutorial(tutorialId: string): void;
    resetTutorial(tutorialId: string): void;
    isStepCompleted(tutorialId: string, stepId: string): boolean;
    isTutorialCompleted(tutorialId: string): boolean;
    getNextIncomplete(tutorialId: string): TutorialStep | null;
    /** Overall onboarding completion percentage (0-100) */
    getOverallProgress(): number;
    /** Whether user has completed the getting_started category */
    isOnboardingComplete(): boolean;
}
