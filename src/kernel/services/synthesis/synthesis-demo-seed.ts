import type { ISynthesisEngineService } from '../../contracts/synthesis-engine';
import type { Synthesis } from '../../types/synthesis-types';

/**
 * Demo seed for the Synthesis Engine: one completed multi-perspective
 * synthesis of the demo storyline question (fully local heuristics).
 *
 * Idempotent: syntheses with DEMO_QUESTION are reused.
 */
export const DEMO_SYNTHESIS_QUESTION = 'Демо: нужны ли агентам тихие часы?';

export async function seedSynthesisDemo(
    service: ISynthesisEngineService,
): Promise<Synthesis> {
    const existing = (await service.list({})).find(
        (s) => s.input.question === DEMO_SYNTHESIS_QUESTION,
    );
    if (existing) return existing;

    const id = await service.synthesize({
        question: DEMO_SYNTHESIS_QUESTION,
        roleIds: ['analyst', 'critic', 'engineer'],
        lensIds: ['lens:critical', 'lens:second-order'],
        depth: 'standard',
    });
    const synthesis = await service.getSynthesis(id);
    if (!synthesis) throw new Error('Synthesis demo: synthesis vanished after generation');
    return synthesis;
}
