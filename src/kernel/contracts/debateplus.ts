import type { ILifecycle } from './lifecycle';

export type DebateFormatId =
    | 'oxford'
    | 'lincoln-douglas'
    | 'popper'
    | 'deliberative'
    | 'munk'
    | 'adversarial';

export interface FormatResult {
    formatId: DebateFormatId;
    topic: string;
    sessionIds: string[];
    winner?: string;
    swing?: number;
    summary: string;
}

/** L.1 — форматные дебаты поверх CouncilService. */
export interface IFormatService extends ILifecycle {
    listFormats(): Array<{ id: DebateFormatId; name: string; description: string }>;
    run(formatId: DebateFormatId, topic: string, opts?: { value?: string; criterion?: string }): Promise<FormatResult>;
}

/** L.2 — формальная аргументация: mining, Dung, Toulmin, Brier, Kialo. */
export interface IArgTechService extends ILifecycle {
    // IBM Debater-style mining
    mineClaims(text: string): Promise<Array<{ claim: string; evidenceHint: string }>>;
    // Dung abstract argumentation
    addDungArgument(id: string, text: string): Promise<void>;
    addDungAttack(from: string, to: string): Promise<void>;
    groundedExtension(): Promise<string[]>;
    preferredExtensions(): Promise<string[][]>;
    // Toulmin cards
    createToulmin(input: {
        claim: string;
        grounds?: string;
        warrant?: string;
        backing?: string;
        qualifier?: string;
        rebuttal?: string;
    }): Promise<{ id: string; completeness: number; gaps: string[] }>;
    // Brier calibration
    forecast(claimId: string, forecaster: string, probability: number): Promise<void>;
    resolveClaim(claimId: string, happened: boolean): Promise<{ brier: number; forecasters: number }>;
    // Kialo-style claim tree
    plantThesis(thesis: string): Promise<string>;
    branchClaim(treeId: string, parentId: string, side: 'pro' | 'con', text: string): Promise<string>;
    voteImpact(nodeId: string, impact: number): Promise<void>;
    treeScore(treeId: string): Promise<{ pro: number; con: number; verdict: string }>;
}
