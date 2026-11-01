/**
 * Программа стратегии дебатов (SPEC_07).
 *
 * Интерпретатор компилирует DSL-определение (`StrategyDraft`) в исполняемую
 * `StrategyProgram`: топологию + маску quality-техник + порядок ходов.
 * Это закрывает разрыв «стратегии декларативны, но не исполняемы».
 */

export type TopologyKind = 'linear' | 'roundtable' | 'judge' | 'tree-of-thought' | 'red-blue';

export type StrategyRoot = 'sequence' | 'debate_graph' | 'critic_loop' | 'voting' | 'peer_review';

export interface StrategyDraftAgent {
    role: 'pro' | 'con' | 'neutral' | 'judge' | 'reviewer' | 'author';
    label?: string;
}

export interface StrategyDraft {
    id: string;
    name?: string;
    root: StrategyRoot;
    maxRounds?: number;
    convergenceThreshold?: number;
    earlyExitConfidence?: number;
    agents?: StrategyDraftAgent[];
    options?: Record<string, unknown>;
}

export interface StrategyTopology {
    kind: TopologyKind;
    maxRounds?: number;
}

export interface StrategyTurnPolicy {
    order: 'sequential' | 'adversarial' | 'free';
    maxIterations?: number;
    stopWhen?: string;
}

export interface StrategyProgram {
    id: string;
    name?: string;
    root: StrategyRoot;
    topology: StrategyTopology;
    /** techniqueId → enabled */
    qualityMask: Record<string, boolean>;
    turnPolicy: StrategyTurnPolicy;
    convergenceThreshold?: number;
    earlyExitConfidence?: number;
}
