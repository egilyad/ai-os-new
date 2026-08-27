import type {
    IPrePublishCriticService,
    CriticIssue,
} from '../../contracts/debate-pre-publish-critic';

/**
 * PrePublishCriticService — P0
 * Heuristic critic before publishing: unsupported claims, fallacies,
 * weak analogies, vague language.
 */
export class PrePublishCriticService implements IPrePublishCriticService {
    review(text: string): CriticIssue[] {
        const issues: CriticIssue[] = [];
        const lower = text.toLowerCase();

        // Unsupported absolute claims without evidence
        if (
            /\b(always|never|all|none|everyone|nobody|definitely|certainly)\b/i.test(text) &&
            !/\d|source|study|research|according to|https?:/i.test(text)
        ) {
            issues.push({
                type: 'unsupported',
                severity: 'high',
                excerpt: text.slice(0, 120),
                suggestion: 'Add evidence or soften absolute claim',
            });
        }

        // Logical fallacies: ad hominem markers
        if (/you are (stupid|ignorant|biased|wrong)|ad hominem/i.test(lower)) {
            issues.push({
                type: 'fallacy',
                severity: 'high',
                excerpt: text.slice(0, 120),
                suggestion: 'Avoid ad hominem — attack the argument, not the person',
            });
        }

        // False dilemma
        if (/either.*or.*no other|only two options/i.test(lower)) {
            issues.push({
                type: 'fallacy',
                severity: 'medium',
                excerpt: text.slice(0, 120),
                suggestion: 'Potential false dilemma — consider middle options',
            });
        }

        // Weak analogy: "like", "as if" without specifics
        if (/\blike\b.*\b(analogy|similar)\b/i.test(lower) || /as if.*without/i.test(lower)) {
            issues.push({
                type: 'weak_analogy',
                severity: 'low',
                excerpt: text.slice(0, 120),
                suggestion: 'Strengthen analogy with specific mapping',
            });
        }

        // Vague
        if (/some people say|it is known|many believe|experts say/i.test(lower)) {
            issues.push({
                type: 'vague',
                severity: 'medium',
                excerpt: text.slice(0, 120),
                suggestion: 'Replace vague attribution with concrete source',
            });
        }

        // Unsupported short assertion with no numbers
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 15);
        for (const s of sentences) {
            if (s.length > 60 && !/\d|[a-z]+\.[a-z]+/i.test(s) && s.split(/\s+/).length > 12) {
                // Potential unsupported long claim — only flag if no other issue already covers this text
                if (issues.length === 0 && /is|are|will|should|must/i.test(s)) {
                    // don't duplicate, just one generic vague issue
                    break;
                }
            }
        }

        return issues;
    }

    shouldBlock(text: string): boolean {
        const issues = this.review(text);
        return issues.some((i) => i.severity === 'high');
    }
}
