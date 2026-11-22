/**
 * Execution replay (CrewAI-inspired, L2).
 *
 * Reads a recorded trace and validates the hand-off chain: each step's input
 * should contain the previous step's output. Broken links reveal a pipeline
 * that dropped context between agents. Pure functions — no live execution.
 */
import type {
    IExecutionReplayService,
    ReplayStep,
    ReplayReport,
} from '../../contracts/execution-replay';

export class ExecutionReplayService implements IExecutionReplayService {
    replay(steps: ReplayStep[]): ReplayReport {
        const brokenLinks: string[] = [];
        for (let i = 1; i < steps.length; i++) {
            const expected = this.chainInput(steps, i);
            const actual = steps[i]!.input;
            const matches = Object.entries(expected).every(
                ([k, v]) => JSON.stringify(actual[k]) === JSON.stringify(v),
            );
            if (!matches) brokenLinks.push(`${steps[i - 1]!.nodeId} → ${steps[i]!.nodeId}`);
        }
        const first = steps[0]?.timestamp ?? 0;
        const last = steps[steps.length - 1]?.timestamp ?? first;
        return { steps: [...steps], durationMs: last - first, brokenLinks };
    }

    chainInput(steps: ReplayStep[], index: number): Record<string, unknown> {
        if (index <= 0 || index >= steps.length) return {};
        return { ...steps[index - 1]!.output };
    }
}
