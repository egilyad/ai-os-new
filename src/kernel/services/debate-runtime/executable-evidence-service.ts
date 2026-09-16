import type {
    IExecutableEvidenceService,
    ExecutableClaim,
} from '../../contracts/debate-executable-evidence';

/**
 * ExecutableEvidenceService — P0
 * Heuristic: numeric claims (percent, x times, $ etc.) are testable;
 * code blocks are ```python / ```js / ```javascript.
 */
export class ExecutableEvidenceService implements IExecutableEvidenceService {
    private readonly testablePattern = /\b(\d+(\.\d+)?\s*%|\d+\s*(times|x)\b|\$\s*\d+|\b\d+\s*(percent|million|billion)\b|\bmore than \d+|\bless than \d+)/i;
    private readonly codeBlockPattern = /```(python|js|javascript|py)\b/i;

    hasTestableClaim(text: string): boolean {
        return this.testablePattern.test(text);
    }

    hasCodeBlock(text: string): boolean {
        return this.codeBlockPattern.test(text);
    }

    validate(text: string): ExecutableClaim[] {
        const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
        return sentences.map((s) => ({
            claimText: s.slice(0, 200),
            isTestable: this.testablePattern.test(s),
            hasCode: this.codeBlockPattern.test(text),
        }));
    }
}
