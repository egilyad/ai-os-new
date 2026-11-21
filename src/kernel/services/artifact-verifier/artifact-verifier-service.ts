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
} from '../../contracts/artifact-verifier';

const ERROR_MARKERS = [
    'not implemented',
    'todo:',
    'error:',
    'failed to',
    'cannot complete',
    'unhandled rejection',
    'undefined is not a function',
];

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

        let expectedOutput = true;
        let keywordScore = 1;
        if (input.expectedOutput && input.expectedOutput.trim()) {
            const expectedTokens = [...new Set(tok(input.expectedOutput))];
            const outTokens = new Set(tok(output));
            const hits = expectedTokens.filter((t) => outTokens.has(t)).length;
            keywordScore = expectedTokens.length > 0 ? hits / expectedTokens.length : 1;
            expectedOutput = keywordScore >= 0.5;
        }

        const deterministicPass = nonEmpty && noErrorMarkers && expectedOutput;
        if (deterministicPass) {
            return {
                verdict: 'pass',
                score: keywordScore,
                checks: { nonEmpty, expectedOutput, noErrorMarkers },
                reasoning: 'deterministic checks passed',
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
                    checks: { nonEmpty, expectedOutput, noErrorMarkers, llmPassed: res.passed },
                    reasoning: res.reasoning,
                    via: res.via === 'llm' ? 'llm' : 'heuristic',
                };
            } catch (e) {
                // LLM failed — fall through to heuristic verdict.
                return this.heuristicVerdict(
                    {
                        nonEmpty,
                        expectedOutput,
                        noErrorMarkers,
                    },
                    e instanceof Error ? e.message : String(e),
                );
            }
        }
        return this.heuristicVerdict({ nonEmpty, expectedOutput, noErrorMarkers });
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
