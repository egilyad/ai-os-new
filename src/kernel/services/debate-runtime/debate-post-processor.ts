import { rootLogger } from '../logger-service';
import type { DebateSession, DebateArgument } from '../../contracts/debate-types';
import { updateConvergenceScore } from './debate-stop-conditions';
import { isDuplicateArgument, normalizeSynonyms } from './debate-duplicate-detection';
import { FactCheckService } from '../fact-check-service';
import { DebateGovernor } from './debate-governor';

const LOGGER = rootLogger.child('DebatePostProcessor');
const MAX_PROCESSED_IDS = 5000;

// ── Socratic Quality Gate ──────────────────────────────────────────────
const TRIVIAL_QUESTION_PATTERNS = [
    /\bcan you elaborate\b/i,
    /\bcan you explain\b/i,
    /\bwhat do you mean\b/i,
    /\bcould you clarify\b/i,
    /\bcould you expand\b/i,
    /\btell me more\b/i,
    /\bcan you provide more\b/i,
    /\bcan you give an example\b/i,
    /\bwhat are your thoughts\b/i,
    /\bwhat is your opinion\b/i,
    /\bhow do you feel\b/i,
    /\bwould you like to\b/i,
    /\bany other\s+(points|thoughts|ideas)\b/i,
    /\bis there anything else\b/i,
    /\bможете уточнить\b/i,
    /\bможете пояснить\b/i,
    /\bрасскажите подробнее\b/i,
    /\bчто вы имеете в виду\b/i,
    /\bпоясните\b/i,
];

const DEEP_QUESTION_PATTERNS = [
    /\b(why|how)\s+(does|is|are|can|would|could|should|must)\b/i,
    /\bwhat (evidence|proof|data|basis|justification)\b/i,
    /\bhow do you (know|justify|support)\b/i,
    /\bwhat (assumption|premise|presupposition)\b/i,
    /\bwhat (follows|implies|entails)\b/i,
    /\bcontradict/i,
    /\binconsistent\b/i,
    /\b(flaw|gap|weakness|fallacy)\b/i,
    /\bwhat would it take\b/i,
    /\bunder what conditions\b/i,
    /\bis it always true\b/i,
    /\bcould there be\b/i,
    /\bwhat about.*(case|scenario|exception)\b/i,
    /\bhow (would|could) you (distinguish|differentiate|reconcile)\b/i,
    /\bwhat is the (counterargument|alternative|trade-off)\b/i,
];

function scoreSocraticQuestion(
    content: string,
    previousArgs: DebateArgument[],
): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const trimmed = content.trim();
    if (!trimmed.endsWith('?')) {
        reasons.push('Not a question');
        return { score: 0, reasons };
    }
    score += 10;
    reasons.push('Is a question');

    for (const pat of TRIVIAL_QUESTION_PATTERNS) {
        if (pat.test(trimmed)) {
            reasons.push('Trivial/syntactic question pattern');
            score -= 30;
            break;
        }
    }

    for (const pat of DEEP_QUESTION_PATTERNS) {
        if (pat.test(trimmed)) {
            score += 20;
            reasons.push('Deep probing pattern');
            break;
        }
    }

    if (previousArgs.length > 0) {
        const lowerContent = trimmed.toLowerCase();
        const allPrevText = previousArgs.map((a) => a.content.toLowerCase()).join(' ');
        const words = lowerContent.split(/\s+/).filter((w) => w.length > 3);
        let overlapCount = 0;
        for (const word of words) {
            if (allPrevText.includes(word)) overlapCount++;
        }
        const overlapRatio = words.length > 0 ? overlapCount / words.length : 0;
        if (overlapRatio > 0.3) {
            score += 15;
            reasons.push('References previous argument content');
        }
    }

    if (/\b(because|cause|lead|result|effect|impact)\b/i.test(trimmed)) {
        score += 15;
        reasons.push('Targets causality');
    }
    if (/\b(evidence|proof|data|study|research|statistic|source)\b/i.test(trimmed)) {
        score += 15;
        reasons.push('Asks for evidence');
    }

    if (trimmed.split(/\s+/).length >= 10) {
        score += 10;
        reasons.push('Sufficient question depth');
    } else if (trimmed.split(/\s+/).length < 5) {
        score -= 10;
        reasons.push('Too short/terse');
    }

    return { score: Math.max(0, score), reasons };
}

export class DebatePostProcessor {
    public factCheckService: FactCheckService;
    private processedArgIds: Set<string>;
    private fedContents: Array<{ agentId: string; content: string }>;

    constructor(deps: { factCheckService: FactCheckService }) {
        this.factCheckService = deps.factCheckService;
        this.processedArgIds = new Set();
        this.fedContents = [];
    }

    clearProcessedIds(): void {
        this.processedArgIds.clear();
        this.fedContents = [];
    }

    destroy(): void {
        this.processedArgIds.clear();
        this.fedContents = [];
    }

    process(session: DebateSession): DebateArgument[] {
        this.processArgumentTree(session);
        this.processDuplicates(session);
        this.processSocraticQuality(session);
        return session.arguments;
    }

    /** Check if content is a near-duplicate of something already fed to governor */
    private isNearDuplicateOfFedContent(content: string, agentId: string): boolean {
        const norm = content
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .trim();
        if (!norm || norm.split(/\s+/).length < 5) return false;

        const tokens = norm.split(/\s+/).filter(Boolean);
        const words = new Set(tokens);
        const synWords = new Set(tokens.map(normalizeSynonyms));

        for (const fed of this.fedContents) {
            if (fed.agentId === agentId) continue;

            const fedTokens = fed.content.split(/\s+/).filter(Boolean);
            const fedWords = new Set(fedTokens);
            const fedSynWords = new Set(fedTokens.map(normalizeSynonyms));

            // Combined: word Jaccard + synonym Jaccard
            const wordSim = this.jaccardSimilarityRaw(words, fedWords);
            const synSim = this.jaccardSimilarityRaw(synWords, fedSynWords);
            const combined = wordSim * 0.6 + synSim * 0.4;
            if (combined > 0.55) return true;
        }
        return false;
    }

    private jaccardSimilarityRaw(a: Set<string>, b: Set<string>): number {
        if (a.size === 0 && b.size === 0) return 0;
        const intersection = new Set([...a].filter((x) => b.has(x)));
        const union = new Set([...a, ...b]);
        return intersection.size / union.size;
    }

    processGovernorFeeding(newArgs: DebateArgument[], governor: DebateGovernor | null): void {
        if (!governor) return;
        for (const arg of newArgs) {
            if (this.processedArgIds.has(arg.id)) continue;
            if (arg.duplicateOf) continue;

            // Near-duplicate check across agents — prevents feeding the same
            // content from multiple agents, which would create false contradictions
            // in the governor (similar claims from different speakers flagged as
            // conflicting when they're actually in agreement).
            if (this.isNearDuplicateOfFedContent(arg.content, arg.agentId)) {
                arg.duplicateOf = 'cross-agent-near-duplicate';
                continue;
            }

            this.processedArgIds.add(arg.id);
            if (this.processedArgIds.size > MAX_PROCESSED_IDS) {
                const first = this.processedArgIds.values().next().value;
                if (first !== undefined) this.processedArgIds.delete(first);
            }

            this.fedContents.push({ agentId: arg.agentId, content: arg.content });
            if (this.fedContents.length > 200) {
                this.fedContents.shift();
            }

            governor.ingestArgument(
                arg.content,
                arg.id,
                arg.agentName,
                arg.position,
                arg.round,
                arg.agentId,
                arg.confidence,
            );
            governor.updateContradictions();
            governor.computeConvergence();
            governor.computeNovelty();
            governor.updateDiversity();
        }
    }

    processFactCheck(newArgs: DebateArgument[]): void {
        for (const arg of newArgs) {
            if (this.processedArgIds.has(arg.id)) continue;
            this.processedArgIds.add(arg.id);
            if (this.processedArgIds.size > MAX_PROCESSED_IDS) {
                const first = this.processedArgIds.values().next().value;
                if (first !== undefined) this.processedArgIds.delete(first);
            }
            void this.factCheckService
                .checkArgument(arg)
                .catch((e) =>
                    LOGGER.warn('DebatePostProcessor', 'Fact-check failed', { error: e }),
                );
        }
    }

    updateConvergenceScore(session: DebateSession): void {
        updateConvergenceScore(session);
    }

    private processArgumentTree(session: DebateSession): void {
        if (session.strategy !== 'argument_tree') return;
        for (const arg of session.arguments) {
            if (arg.parentId !== undefined) continue;
            const parentMatch = arg.content.match(/\[parent:([^\]]+)\]/);
            if (parentMatch) {
                arg.rawParentRef = parentMatch[1];
                arg.content = arg.content.replace(/\[parent:[^\]]+\]/, '').trim();
                const refExists = session.arguments.some((a) => a.id === arg.rawParentRef);
                if (refExists) {
                    arg.parentId = arg.rawParentRef;
                    arg.parentResolution = 'explicit';
                } else {
                    const latest = [...session.arguments]
                        .reverse()
                        .find((a) => a.round < arg.round);
                    arg.parentId = latest?.id;
                    arg.parentResolution = 'invalid_reference';
                }
            } else {
                const latest = [...session.arguments].reverse().find((a) => a.round < arg.round);
                arg.parentId = latest?.id;
                arg.parentResolution = latest ? 'fallback_latest' : 'orphan';
            }
        }
    }

    private processDuplicates(session: DebateSession): void {
        for (const arg of session.arguments) {
            if (arg.duplicateOf) continue;
            const { isDuplicate, match } = isDuplicateArgument(arg.content, session.arguments);
            if (isDuplicate && match && match.id !== arg.id) {
                arg.duplicateOf = match.id;
            }
        }
    }

    private processSocraticQuality(session: DebateSession): void {
        if (session.strategy !== 'socratic') return;
        const questionerIndex = session.socraticQuestioner ?? 0;
        for (const arg of session.arguments) {
            if (arg.duplicateOf) continue;
            if (session.participants[questionerIndex]?.id === arg.agentId) {
                const result = scoreSocraticQuestion(arg.content, session.arguments);
                arg.socraticQuality = result.score || undefined;
                arg.socraticQualityReasons = result.reasons.length > 0 ? result.reasons : undefined;
            }
        }
    }
}
