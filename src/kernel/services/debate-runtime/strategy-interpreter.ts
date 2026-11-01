import type {
    StrategyDraft,
    StrategyProgram,
} from '../../contracts/strategy-program';

/**
 * Сопоставление root-примитива → топология + quality-маска + порядок ходов.
 * (таблица из SPEC_07 / исследования argumentation).
 */
const ROOT_TABLE: Record<
    StrategyDraft['root'],
    {
        topology: StrategyProgram['topology']['kind'];
        quality: string[];
        order: StrategyProgram['turnPolicy']['order'];
        stopWhen?: string;
    }
> = {
    sequence: { topology: 'linear', quality: [], order: 'sequential' },
    debate_graph: { topology: 'roundtable', quality: [], order: 'free' },
    critic_loop: {
        topology: 'roundtable',
        quality: ['critic', 'socratic-pivot'],
        order: 'adversarial',
        stopWhen: 'agreement',
    },
    voting: {
        topology: 'judge',
        quality: ['blind-evaluation', 'bayesian-judges'],
        order: 'free',
    },
    peer_review: {
        topology: 'judge',
        quality: ['blind-evaluation', 'judge-deliberation'],
        order: 'sequential',
    },
};

/**
 * Интерпретатор стратегий (SPEC_07).
 *
 * Компилирует StrategyDraft в StrategyProgram. Это автономный слой:
 * движок дебатов может исполнять полученную программу, не зная внутренностей
 * DSL.
 */
export function interpret(draft: StrategyDraft): StrategyProgram {
    const table = ROOT_TABLE[draft.root];

    const qualityMask: Record<string, boolean> = {};
    for (const t of table.quality) {
        qualityMask[t] = true;
    }

    const maxRounds = draft.maxRounds ?? (draft.root === 'critic_loop' ? 6 : 5);

    return {
        id: draft.id,
        name: draft.name,
        root: draft.root,
        topology: { kind: table.topology, maxRounds },
        qualityMask,
        turnPolicy: {
            order: table.order,
            maxIterations: table.order === 'adversarial' ? maxRounds : undefined,
            stopWhen: table.stopWhen,
        },
        convergenceThreshold: draft.convergenceThreshold,
        earlyExitConfidence: draft.earlyExitConfidence,
    };
}

/**
 * Удобный конструктор builtin-подобных драфтов.
 */
export function draft(
    id: string,
    root: StrategyDraft['root'],
    partial?: Partial<Omit<StrategyDraft, 'id' | 'root'>>,
): StrategyDraft {
    return { id, root, ...partial };
}
