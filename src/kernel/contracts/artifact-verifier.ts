import type { ILifecycle } from './lifecycle';

export interface ArtifactVerification {
    verdict: 'pass' | 'revise' | 'reject';
    score: number;
    checks: {
        nonEmpty: boolean;
        expectedOutput: boolean;
        noErrorMarkers: boolean;
        llmPassed?: boolean;
    };
    reasoning: string;
    via: 'heuristic' | 'llm';
}

export interface VerifyArtifactInput {
    task: string;
    output: string;
    expectedOutput?: string;
}

/** Verifier for agent-produced artifacts: deterministic checks + optional LLM judge. */
export interface IArtifactVerifierService extends ILifecycle {
    verify(input: VerifyArtifactInput): Promise<ArtifactVerification>;
}
