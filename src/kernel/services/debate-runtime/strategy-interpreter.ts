import type { StrategyDraft, StrategyProgram } from '../../contracts/strategy-program';

/** Исполняемый план дебатов (сжимает StrategyProgram для движка). */
export interface DebateExecutionPlan {
    topology: string;
    techniques: string[];
    maxRounds?: number;
    earlyExitConfidence?: number;
    convergenceThreshold?: number;
    order?: string;
    stopWhen?: string;
}

/** Конвертирует StrategyProgram в DebateExecutionPlan. */
export function programToPlan(program: StrategyProgram): DebateExecutionPlan {
    return {
        topology: program.topology.kind,
        techniques: Object.keys(program.qualityMask).filter((k) => program.qualityMask[k]),
        maxRounds: program.topology.maxRounds,
        earlyExitConfidence: program.earlyExitConfidence,
        convergenceThreshold: program.convergenceThreshold,
        order: program.turnPolicy.order,
        stopWhen: program.turnPolicy.stopWhen,
    };
}

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
    // Защита от неизвестного корня: fallback на roundtable (debate_graph).
    const table = ROOT_TABLE[draft.root] ?? ROOT_TABLE.debate_graph;

    const qualityMask: Record<string, boolean> = {};
    for (const t of table.quality) {
        qualityMask[t] = true;
    }

    const maxRounds = Math.max(1, draft.maxRounds ?? (draft.root === 'critic_loop' ? 6 : 5));

    const clamp01 = (v?: number): number | undefined =>
        v === undefined ? undefined : Math.min(1, Math.max(0, v));

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
        convergenceThreshold: clamp01(draft.convergenceThreshold),
        earlyExitConfidence: clamp01(draft.earlyExitConfidence),
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

/**
 * Известные builtin-стратегии → root-примитив.
 * (неполный, но покрывает ключевые).
 */
const BUILTIN_ROOTS: Record<string, StrategyDraft['root']> = {
    'builtin.round_robin': 'debate_graph',
    'builtin.socratic': 'critic_loop',
    'builtin.argument_tree': 'debate_graph',
    'builtin.constrained': 'peer_review',
    'builtin.moderated': 'debate_graph',
    'builtin.free_for_all': 'debate_graph',
    'builtin.jury_trial': 'debate_graph',
    'builtin.brainstorming': 'sequence',
    'builtin.delphi': 'debate_graph',
    'builtin.debate_athon': 'sequence',
    'builtin.meta_debate': 'debate_graph',
    'builtin.autopsy': 'debate_graph',
    'builtin.simulated_negotiation': 'debate_graph',
    'builtin.premortem': 'sequence',
    'builtin.red_teaming': 'debate_graph',
    'builtin.rhetorical_triangle': 'debate_graph',
    'builtin.evidence_based_policy': 'debate_graph',
    'builtin.principle_based_negotiation': 'debate_graph',
    'builtin.uncertainty_quantification': 'debate_graph',
    'builtin.multi_criteria': 'debate_graph',
    'builtin.stakeholder_mapping': 'sequence',
    'builtin.cross_examination': 'debate_graph',
    'builtin.trial': 'sequence',
    'builtin.parliamentary': 'debate_graph',
    'builtin.oxford_union': 'sequence',
    'builtin.lincoln_douglas': 'debate_graph',
    'builtin.spontaneous_argumentation': 'debate_graph',
    'builtin.asynchronous_marathon': 'sequence',
    'builtin.flash_debate': 'debate_graph',
    'builtin.collaborative_consensus': 'debate_graph',
    'builtin.scenario_testing': 'sequence',
    'builtin.hypothesis_testing': 'sequence',
    'builtin.contest_mode': 'sequence',
};

/**
 * Компилирует известную builtin-стратегию в StrategyProgram.
 * Возвращает null для неизвестных имён.
 */
export function compileBuiltin(id: string): StrategyProgram | null {
    const root = BUILTIN_ROOTS[id];
    if (!root) return null;
    return interpret(draft(id, root));
}

/**
 * Компилирует полноценное DSL-определение (StrategyDefinition) в StrategyProgram.
 * Это мост между StrategyRegistry (валидация/реестр) и исполняемым планом.
 */
export function compileDefinition(def: {
    id: string;
    root: {
        type: string;
        maxRounds?: number;
        convergenceThreshold?: number;
        earlyExitConfidence?: number;
    };
}): StrategyProgram {
    const rootType = def.root.type;
    const root: StrategyRoot =
        rootType === 'sequence' ||
        rootType === 'debate_graph' ||
        rootType === 'critic_loop' ||
        rootType === 'voting' ||
        rootType === 'peer_review'
            ? rootType
            : 'debate_graph';
    return interpret(
        draft(def.id, root, {
            maxRounds: def.root.maxRounds,
            convergenceThreshold: def.root.convergenceThreshold,
            earlyExitConfidence: def.root.earlyExitConfidence,
        }),
    );
}
