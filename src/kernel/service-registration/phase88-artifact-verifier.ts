/** Phase 88 — artifact verifier (executor → verifier → patch loop). */
import type { Phase } from './helpers';
import type { IContainer } from '../container';

import type { ILlmJudgeService } from '../contracts/eval-scorer';
import { ArtifactVerifierService } from '../services/artifact-verifier/artifact-verifier-service';

export const registerPhase88: Phase = ({ register }) => {
    register('artifactVerifierService', (c: IContainer) => {
        const judge = c.has('llmJudgeService')
            ? c.get<ILlmJudgeService>('llmJudgeService')
            : undefined;
        return new ArtifactVerifierService(
            judge
                ? { judge: (task, output, reference) => judge.judge(task, output, reference) }
                : undefined,
        );
    });
};
