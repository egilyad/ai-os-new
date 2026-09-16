import type { ILifecycle } from './lifecycle';
import type {
    Synthesis,
    SynthesisFeedback,
    SynthesisId,
    SynthesisInput,
    SynthesisQuery,
} from '../types/synthesis-types';
import type { CrystalId } from '../types/crystal-types';

/**
 * Synthesis Engine — multi-perspective consensus (plan §4).
 *
 * An orchestrator (NOT a single agent):
 *   1. Decomposition    — question → sub-questions (analytical lens).
 *   2. Parallel        — (role × lens) pairs → perspectives (parallel workers).
 *   3. Cross-Perspective Debate — perspectives collide (strategy from 13).
 *   4. Zone Identification — meta:navigator separates consensus/dissent/uncertainty.
 *   5. Synthesis Statement — explicitly qualified final statement.
 *   6. Optional Crystallization — strong consensus → crystal; dissent → multi-perspective.
 *
 * Dissent is never suppressed: irreducible dissent is preserved in the output.
 */
export interface ISynthesisEngineService extends ILifecycle {
    /** Start a synthesis run. Returns the new synthesis id. */
    synthesize(input: SynthesisInput): Promise<SynthesisId>;
    /** Get a synthesis by id. */
    getSynthesis(id: SynthesisId): Promise<Synthesis | null>;
    /** List syntheses with optional status filter. */
    list(opts?: SynthesisQuery): Promise<Synthesis[]>;
    /** Refine a completed synthesis with human feedback → new synthesis. */
    refine(id: SynthesisId, feedback: SynthesisFeedback): Promise<Synthesis | null>;
    /** Export strong-consensus zones as a crystal. */
    exportToCrystal(id: SynthesisId): Promise<CrystalId>;
    /** Publish the synthesis statement to the forum (emits event). */
    exportToForum(id: SynthesisId): Promise<string>;
}
