/**
 * Artifact verifier — the "executor → verifier → patch" loop's judge.
 *
 * Deterministic checks run first (cheap, offline): non-empty output, expected
 * keywords present, no error markers. When an LLM judge is wired and the
 * deterministic layer is inconclusive, it makes the final call. The verifier
 * never mutates the artifact — callers decide how to apply the verdict.
 */
import type {
    IArtifactVerifierService,
    ArtifactVerification,
    VerifyArtifactInput,
    RefinementComparison,
} from '../../contracts/artifact-verifier';

const ERROR_MARKERS = [
    'not implemented',
    'todo:',
    'error:',
    'failed to',
    'cannot complete',
    'unhandled rejection',
    'undefined is not a function',
    'placeholder',
    'stub',
    'lorem ipsum',
    'to be done',
    'coming soon',
];

// Generic words that cannot prove a result is correct even when present.
const STOPWORDS = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'are',
    'was',
    'were',
    'has',
    'have',
    'will',
    'can',
    'not',
    'but',
    'you',
    'your',
    'its',
    'into',
    'это',
    'для',
    'что',
    'как',
    'или',
    'but',
    'the',
    'test',
    'code',
    'work',
]);

function tok(s: string): string[] {
    return s
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length > 2);
}

export class ArtifactVerifierService implements IArtifactVerifierService {
    constructor(
        private judge?: {
            judge(
                task: string,
                output: string,
                reference?: string,
            ): Promise<{
                score: number;
                passed: boolean;
                reasoning: string;
                via?: 'stub' | 'llm';
            }>;
        },
    ) {}

    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    async verify(input: VerifyArtifactInput): Promise<ArtifactVerification> {
        const output = input.output ?? '';
        const nonEmpty = output.trim().length > 0;
        const lower = output.toLowerCase();
        const noErrorMarkers = !ERROR_MARKERS.some((m) => lower.includes(m));

        // Substantive = enough distinct content tokens and not a stub.
        const contentTokens = new Set(tok(output).filter((t) => !STOPWORDS.has(t)));
        const substantive = contentTokens.size >= 8;

        let expectedOutput = true;
        let keywordScore = 1;
        if (input.expectedOutput && input.expectedOutput.trim()) {
            const expectedTokens = [
                ...new Set(tok(input.expectedOutput).filter((t) => !STOPWORDS.has(t))),
            ];
            const outTokens = new Set(tok(output));
            const hits = expectedTokens.filter((t) => outTokens.has(t)).length;
            keywordScore = expectedTokens.length > 0 ? hits / expectedTokens.length : 1;
            // 0.7 — partial keyword overlap alone must not prove correctness.
            expectedOutput = keywordScore >= 0.7;
        }

        const checks = { nonEmpty, expectedOutput, noErrorMarkers, substantive, keywordScore };
        const deterministicPass = nonEmpty && noErrorMarkers && substantive && expectedOutput;
        if (deterministicPass) {
            return {
                verdict: 'pass',
                score: keywordScore,
                checks,
                reasoning: 'deterministic checks passed (keywords filtered, substantive)',
                via: 'heuristic',
            };
        }

        if (this.judge) {
            try {
                const res = await this.judge.judge(input.task, output, input.expectedOutput);
                const verdict = res.passed ? 'pass' : res.score >= 0.4 ? 'revise' : 'reject';
                return {
                    verdict,
                    score: res.score,
                    checks: { ...checks, llmPassed: res.passed },
                    reasoning: res.reasoning,
                    via: res.via === 'llm' ? 'llm' : 'heuristic',
                };
            } catch (e) {
                // LLM failed — fall through to heuristic verdict.
                return this.heuristicVerdict(checks, e instanceof Error ? e.message : String(e));
            }
        }
        return this.heuristicVerdict(checks);
    }

    compare(
        before: { overall: number; axes?: Record<string, number> },
        after: { overall: number; axes?: Record<string, number> },
    ): RefinementComparison {
        const deltas: Record<string, number> = {};
        let totalGain = 0;
        let totalDrop = 0;
        const axisNames = new Set([
            ...Object.keys(before.axes ?? {}),
            ...Object.keys(after.axes ?? {}),
        ]);
        for (const axis of axisNames) {
            if (axis === 'Overall' || axis === 'Confidence') continue;
            const delta = (after.axes?.[axis] ?? 0) - (before.axes?.[axis] ?? 0);
            deltas[axis] = delta;
            if (delta > 0) totalGain += delta;
            else if (delta < 0) totalDrop += Math.abs(delta);
        }

        let outcome: RefinementComparison['outcome'];
        let revert: boolean;
        let reasoning: string;
        if (after.overall > before.overall) {
            outcome = 'ACCEPTED_SCORE_INCREASE';
            revert = false;
            reasoning = `Overall improved ${before.overall} → ${after.overall}`;
        } else if (after.overall < before.overall) {
            outcome = 'REJECTED_SCORE_DECREASE';
            revert = true;
            reasoning = `Overall degraded ${before.overall} → ${after.overall}`;
        } else if (totalDrop > totalGain) {
            outcome = 'REJECTED_DEGRADATION';
            revert = true;
            reasoning = `Overall unchanged but sub-axes degraded (drop ${totalDrop} > gain ${totalGain})`;
        } else {
            outcome = 'ACCEPTED_NEUTRAL_IMPROVEMENT';
            revert = false;
            reasoning = `Overall unchanged, sub-axes stable/improved (gain ${totalGain}, drop ${totalDrop})`;
        }
        return {
            before: before.overall,
            after: after.overall,
            deltas,
            totalGain,
            totalDrop,
            outcome,
            revert,
            reasoning,
        };
    }

    private heuristicVerdict(
        checks: ArtifactVerification['checks'],
        judgeError?: string,
    ): ArtifactVerification {
        const score = checks.nonEmpty ? (checks.noErrorMarkers ? 0.6 : 0.3) : 0;
        const verdict = !checks.nonEmpty || !checks.noErrorMarkers ? 'reject' : 'revise';
        return {
            verdict,
            score,
            checks,
            reasoning:
                `heuristic verdict (expectedOutput=${checks.expectedOutput})` +
                (judgeError ? `; judge failed: ${judgeError.slice(0, 120)}` : ''),
            via: 'heuristic',
        };
    }
}
