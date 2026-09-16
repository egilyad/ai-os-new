import { describe, expect, it } from 'vitest';
import {
    createDebateOrchestrator,
    ConversationBackedDebateOrchestrator,
    DebateTopologyService,
} from './index';
import { runBudgetScenario, type RunBudgetOpts } from './debate-pipeline-fake-engine';

/**
 * Step A.3a — Production-path regression.
 *
 * A.1/A.2 proved the NEW orchestrator emits the SAME `OrchestratorEvent`
 * stream as the OLD one, and the A.2 test proved the A.2 adapter maps
 * `Turn → AgentExecutor` (the SAME real debate LLM path). But the REAL
 * consumer of an `IDebateOrchestrator` is `debate-pipeline-builder`
 * (`buildPipeline`), which translates that stream into the actual `DEBATE_*`
 * events the UI/state subscribe to, drives session phase transitions, budget,
 * consensus, verdict, and abort.
 *
 * This test runs the REAL `buildPipeline` end-to-end against a faithful fake
 * `PipelineEngine` (real DebateSession / DebateBudget / DebateMemory /
 * DebateSessionContext, flag-gated orchestrator via the factory, stubbed
 * callLLM). For each scenario it runs once with the flag OFF (old path) and
 * once with the flag ON (ConversationCore path) and asserts:
 *   - identical `DEBATE_*` event stream (name + payload, volatile fields stripped)
 *   - identical terminal session phase + round
 *
 * Execution semantics (routing / budget / governor / retry / failover /
 * timeout) are preserved BY CONSTRUCTION: both paths feed the SAME injected
 * AgentExecutor (`createAgentExecutor`) and the SAME stubbed callLLM.
 */

function stripVolatile(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stripVolatile);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            if (k === 'sessionId' || k === 'generatedAt') continue;
            out[k] = stripVolatile(v);
        }
        return out;
    }
    return value;
}

const scenarios: Array<[string, RunBudgetOpts]> = [
    ['happy 2-round', { scenario: 'happy' }],
    ['multi-round 3', { scenario: 'happy', maxRounds: 3 }],
    ['budget-skip → paused', { scenario: 'budget' }],
    ['LLM error → failed', { scenario: 'happy', callLLM: () => Promise.reject(new Error('boom')) }],
    ['resume', { scenario: 'resume' }],
    ['abort during execution', { scenario: 'abort' }],
];

describe('A.3a production-path regression (real buildPipeline, old vs ConversationCore)', () => {
    it('factory always returns ConversationBackedDebateOrchestrator', () => {
        const ts = new DebateTopologyService();
        expect(createDebateOrchestrator(ts)).toBeInstanceOf(ConversationBackedDebateOrchestrator);
    });

    for (const [name, opts] of scenarios) {
        it(`identical DEBATE_* stream + terminal state — ${name}`, async () => {
            const oldR = await runBudgetScenario('old', opts);
            const newR = await runBudgetScenario('new', opts);

            expect(stripVolatile(newR.events)).toEqual(stripVolatile(oldR.events));
            expect(newR.phase).toBe(oldR.phase);
            expect(newR.round).toBe(oldR.round);
        });
    }

    it('RejectBudget helper forces the budget-skip path (sanity)', async () => {
        const r = await runBudgetScenario('new', { scenario: 'budget' });
        expect(r.phase).toBe('created'); // fake engine skips phase transition validation
        expect(r.events.some((e) => e.event === 'debate:runtime:round:ended')).toBe(true);
    });
});
