// ── LogicalFormExtractor (P1.25) ──────────────────────────────────────────
// Heuristic logical form extraction and enthymeme detection from argument text.
// No LLM calls — pure pattern matching on rhetorical and logical markers.

import type {
    ILogicalFormExtractor,
    LogicalForm,
    LogicalFormType,
    LogicalPremise,
    EnthymemeTarget,
} from '../../contracts/debate-logic';

/** Patterns suggesting a conclusion (therefore, thus, so, hence, accordingly). */
const CONCLUSION_LEADERS = [
    /therefore/i,
    /thus/i,
    /\bso\b/i,
    /hence/i,
    /accordingly/i,
    /consequently/i,
    /that means/i,
    /which implies/i,
    /следовательно/i,
    /поэтому/i,
    /итак/i,
    /значит/i,
    /отсюда/i,
    /вот почему/i,
];

/** Patterns suggesting a premise (because, since, as, given that, in light of). */
const PREMISE_LEADERS = [
    /because/i,
    /since/i,
    /\bas\b/i,
    /given that/i,
    /in light of/i,
    /due to/i,
    /owing to/i,
    /on the grounds that/i,
    /considering/i,
    /seeing as/i,
    /потому что/i,
    /так как/i,
    /поскольку/i,
    /исходя из/i,
    /учитывая/i,
    /благодаря/i,
];

const ENTHYMEME_INDICATORS = [
    /obviously/i,
    /clearly/i,
    /of course/i,
    /it goes without saying/i,
    /naturally/i,
    /everyone knows/i,
    /it stands to reason/i,
    /разумеется/i,
    /очевидно/i,
    /само собой/i,
    /каждый знает/i,
    /естественно/i,
];

export class LogicalFormExtractor implements ILogicalFormExtractor {
    /** Stored forms keyed by `${agentId}:${round}` */
    private forms = new Map<string, LogicalForm>();
    /** Stored enthymeme targets keyed by `${agentId}:${round}` */
    private targets = new Map<string, EnthymemeTarget[]>();

    analyzeArgument(agentId: string, round: number, content: string): LogicalForm | null {
        if (content.length < 50) return null;

        const sentences = this.splitSentences(content);
        if (sentences.length < 2) return null;

        const formType = this.detectFormType(content, sentences);
        const { majorPremise, minorPremise, conclusion } = this.extractStructure(
            content,
            sentences,
        );

        const hasEnthymeme = this.detectEnthymeme(majorPremise, minorPremise, content);
        const isValid = this.validateForm(majorPremise, minorPremise, conclusion);

        const form: LogicalForm = {
            type: formType,
            majorPremise,
            minorPremise,
            conclusion,
            isValid,
            hasEnthymeme,
        };

        this.forms.set(`${agentId}:${round}`, form);

        // Build enthymeme targets if hidden premise detected
        if (hasEnthymeme) {
            const hidden = this.reconstructHiddenPremise(majorPremise, minorPremise, conclusion);
            const target: EnthymemeTarget = {
                agentId,
                round,
                hiddenPremise: hidden,
                originalClaim: conclusion,
                confidence: 0.7,
            };
            const existing = this.targets.get(`${agentId}:${round}`) || [];
            existing.push(target);
            this.targets.set(`${agentId}:${round}`, existing);
        }

        return form;
    }

    getEnthymemeTargets(agentId: string, round: number): EnthymemeTarget[] {
        return this.targets.get(`${agentId}:${round}`) || [];
    }

    getFormattedTargets(agentId: string, round: number, language = 'Russian'): string {
        const targets = this.getEnthymemeTargets(agentId, round);
        if (targets.length === 0) return '';

        const lines = targets.map(
            (t, i) =>
                `${i + 1}. Hidden premise in: "${t.originalClaim.slice(0, 150)}"` +
                `\n   → Reconstructed: "${t.hiddenPremise}"`,
        );

        if (language === 'Russian') {
            return (
                '\n\n### Hidden Premises (Enthymemes) to Attack\n' +
                'The opponent relies on UNSTATED assumptions. Attack them:\n' +
                lines.join('\n\n')
            );
        }

        return (
            '\n\n### Hidden Premises (Enthymemes) to Attack\n' +
            'The opponent relies on UNSTATED assumptions. Attack them:\n' +
            lines.join('\n\n')
        );
    }

    clearSession(): void {
        this.forms.clear();
        this.targets.clear();
    }

    // ── Private helpers ─────────────────────────────────────────────

    private splitSentences(text: string): string[] {
        return text
            .split(/[.!?\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 10);
    }

    private detectFormType(content: string, _sentences: string[]): LogicalFormType {
        // If/then patterns → modus ponens or hypothetical syllogism
        if (/if\s+\w+.*\s+then|if\s+\w+,|если\s+\w+.*\s+то|если\s+\w+,/i.test(content))
            return 'hypothetical_syllogism';

        // Either/or patterns → disjunctive syllogism
        if (/either.*or|или.*или|либо.*либо/i.test(content)) return 'disjunctive_syllogism';

        // All/every pattern → categorical syllogism
        if (/all\s+\w+|every\s+\w+|each\s+\w+|no\s+\w+|все\s+|каждый\s+|ни\s+один/i.test(content))
            return 'categorical_syllogism';

        // Negation patterns → modus tollens
        if (/(?:not|never|no)\s+\w+.*?therefore|не\s+.*?поэтому/i.test(content))
            return 'modus_tollens';

        // Analogy patterns
        if (/like\s+|similar\s+to|as\s+if|analogous|подобно|как\s+и|аналогично/i.test(content))
            return 'analogy';

        // Cause-effect patterns
        if (
            /because|therefore|thus|hence|causes?|leads?\s+to|results?\s+in|приводит|вызывает|из-за/i.test(
                content,
            )
        )
            return 'cause_effect';

        // Authority patterns
        if (
            /(?:according to|as \w+ said|expert\w*\s+say|\w+ argues|по\s+словам|как\s+сказал|эксперт|специалист)/i.test(
                content,
            )
        )
            return 'authority';

        return 'generalization';
    }

    private extractStructure(
        _content: string,
        sentences: string[],
    ): {
        majorPremise: LogicalPremise;
        minorPremise: LogicalPremise;
        conclusion: string;
    } {
        const conclusionSentences: string[] = [];
        const premiseSentences: string[] = [];

        for (const s of sentences) {
            if (CONCLUSION_LEADERS.some((p) => p.test(s))) {
                conclusionSentences.push(s);
            } else if (PREMISE_LEADERS.some((p) => p.test(s))) {
                premiseSentences.push(s);
            }
        }

        // If no clear structure, use heuristic: last sentence is likely the conclusion
        const conclusion =
            conclusionSentences.length > 0
                ? conclusionSentences.join(' ')
                : sentences[sentences.length - 1]!;

        const premises =
            premiseSentences.length > 0
                ? premiseSentences
                : sentences.slice(0, Math.min(2, sentences.length - 1));

        const majorPremiseText =
            premises.length > 0
                ? premises[0]!
                : 'All observed cases follow this pattern (implicit)';
        const minorPremiseText =
            premises.length > 1 ? premises[1]! : 'This case follows the same pattern (implicit)';

        const hasEnthymemeMajor = !premises.length;
        const hasEnthymemeMinor = premises.length < 2 && premises.length > 0;

        return {
            majorPremise: {
                text: majorPremiseText,
                isExplicit: !hasEnthymemeMajor,
                confidence: hasEnthymemeMajor ? 0.4 : 0.8,
            },
            minorPremise: {
                text: minorPremiseText,
                isExplicit: !hasEnthymemeMinor,
                confidence: hasEnthymemeMinor ? 0.5 : 0.8,
            },
            conclusion: conclusion!,
        };
    }

    private detectEnthymeme(
        major: LogicalPremise,
        minor: LogicalPremise,
        content: string,
    ): boolean {
        if (!major.isExplicit || !minor.isExplicit) return true;

        // Check for enthymeme indicators in the content
        return ENTHYMEME_INDICATORS.some((p) => p.test(content));
    }

    private reconstructHiddenPremise(
        major: LogicalPremise,
        _minor: LogicalPremise,
        conclusion: string,
    ): string {
        if (!major.isExplicit) {
            return `The argument assumes without evidence that: "${conclusion.slice(0, 100)}" is a valid generalization from limited observations.`;
        }
        return `The argument relies on the unstated assumption that "${conclusion.slice(0, 100)}" follows necessarily from the given premises.`;
    }

    private validateForm(
        major: LogicalPremise,
        _minor: LogicalPremise,
        _conclusion: string,
    ): boolean {
        if (!major.isExplicit) return false;
        return major.confidence >= 0.4;
    }
}
