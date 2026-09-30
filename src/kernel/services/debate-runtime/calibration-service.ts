// ── CalibrationService (P1.3) ─────────────────────────────────────────
// Heuristic claim-level confidence scoring + calibration enforcement.
// Detects overconfidence/underconfidence mismatches and tracks
// calibration history per agent for enforcement prompts.

import type {
    ICalibrationService,
    ClaimScore,
    CalibrationViolation,
} from '../../contracts/debate-calibration';

interface AgentCalibrationRecord {
    rounds: Array<{
        round: number;
        avgScore: number;
        wasAccurate: boolean;
        violationType?: 'overconfident' | 'underconfident';
    }>;
    overconfidenceCount: number;
}

// Regular expressions for evidence pattern detection
const CITATION_PATTERN =
    /\([^)]*\d{4}[^)]*\)|\[\d+\]|(source|study|research|according to)\s[^.]+/gi;
const DATA_PATTERN =
    /\b\d+(?:\.\d+)?\s*(?:%|million|billion|trillion|years?|times?|x)\b|\b\d{2,}(?:%|th|\b)/g;
const ABSOLUTE_PATTERN =
    /\b(always|never|everyone|nobody|undoubtedly|certainly|definitely|absolutely|without doubt|no question|unquestionably)\b/gi;
const HEDGE_PATTERN =
    /\b(i think|i believe|i feel|maybe|perhaps|possibly|might|could|may|seems?|appears?|arguably|presumably|in my opinion)\b/gi;

// P1.27 uncertainty markers — extract stated confidence.
// 10.15: trailing \b (not \s) so end-of-sentence markers match too.
const CERTAIN_PATTERN = /\b(certain|certainly|undoubtedly|definitely|absolutely)\b/gi;
const LIKELY_PATTERN = /\b(likely|probably|expected|presumably)\b/gi;
const POSSIBLE_PATTERN = /\b(possible|perhaps|maybe|might|could|may)\b/gi;
const UNLIKELY_PATTERN = /\b(unlikely|improbable|doubtful|unexpected)\b/gi;
const IMPOSSIBLE_PATTERN = /\b(impossible|no way|cannot be|couldn't possibly)\b/gi;

const CLAIM_SEPARATOR = /[.!?]\s+/g;

const MAX_HISTORY = 20;

// All patterns above carry the /g flag but are only used with .test() —
// without resetting lastIndex, matches depend on previous calls (a match
// alternates true/false across invocations). Always go through here.
function testFresh(re: RegExp, text: string): boolean {
    re.lastIndex = 0;
    return re.test(text);
}

// Negation within a few words before a confidence marker inverts it
// ("not impossible" ≈ certain, "not certain" ≈ impossible).
const NEGATION_PATTERN = /\b(not|no|never|n't|hardly|barely|scarcely|without)\b/i;

function extractStatedConfidence(text: string): number {
    const cands: Array<{ re: RegExp; score: number }> = [
        { re: IMPOSSIBLE_PATTERN, score: 0.05 },
        { re: UNLIKELY_PATTERN, score: 0.3 },
        { re: CERTAIN_PATTERN, score: 0.95 },
        { re: LIKELY_PATTERN, score: 0.7 },
        { re: POSSIBLE_PATTERN, score: 0.5 },
    ];
    // 10.15: earliest match wins (not fixed priority order), so "certain
    // … unlikely" scores by position; a preceding negation flips the scale.
    let best: { index: number; score: number } | null = null;
    for (const { re, score } of cands) {
        re.lastIndex = 0;
        const m = re.exec(text);
        if (m && (best === null || m.index < best.index)) best = { index: m.index, score };
    }
    if (!best) return -1;
    const before = text.slice(Math.max(0, best.index - 24), best.index);
    if (testFresh(NEGATION_PATTERN, before)) return Math.round((1 - best.score) * 100) / 100;
    return best.score;
}

function scoreSingleClaim(
    text: string,
): Omit<ClaimScore, 'claimText'> & { violationType?: 'overconfident' | 'underconfident' } {
    const hasCitation = testFresh(CITATION_PATTERN, text);
    const hasData = testFresh(DATA_PATTERN, text);
    const hasAbsoluteLanguage = testFresh(ABSOLUTE_PATTERN, text);
    const hasHedge = testFresh(HEDGE_PATTERN, text);
    const statedConfidence = extractStatedConfidence(text);

    // Heuristic scoring
    let base = 0.35;
    if (hasCitation) base += 0.25;
    if (hasData) base += 0.15;
    if (hasAbsoluteLanguage) base -= 0.2;
    if (hasHedge) base -= 0.1;

    const heuristicScore = Math.max(0, Math.min(1, base));

    // Detect mismatch between stated confidence and heuristic
    let mismatch = 0;
    const violationType =
        statedConfidence >= 0
            ? statedConfidence > heuristicScore + 0.3
                ? ('overconfident' as const)
                : statedConfidence < heuristicScore - 0.3
                  ? ('underconfident' as const)
                  : undefined
            : undefined;

    if (violationType) {
        mismatch = Math.abs(statedConfidence - heuristicScore);
    }

    return {
        heuristicScore,
        statedConfidence,
        mismatch,
        hasCitation,
        hasData,
        hasAbsoluteLanguage,
        violationType,
    };
}

export class CalibrationService implements ICalibrationService {
    private agentRecords = new Map<string, AgentCalibrationRecord>();

    scoreClaims(text: string): {
        scores: ClaimScore[];
        avgHeuristic: number;
        violations: CalibrationViolation[];
    } {
        const sentences = text.split(CLAIM_SEPARATOR).filter((s) => s.trim().length > 20);
        const scores: ClaimScore[] = [];
        const violations: CalibrationViolation[] = [];

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length < 10) continue;
            const result = scoreSingleClaim(trimmed);
            const score: ClaimScore = {
                claimText: trimmed.slice(0, 120),
                ...result,
            };
            scores.push(score);

            if (result.violationType) {
                violations.push({
                    agentId: '',
                    round: 0,
                    score: result.heuristicScore,
                    violationType: result.violationType,
                    claimSnippet: trimmed.slice(0, 80),
                });
            }
        }

        const avgHeuristic =
            scores.length > 0
                ? scores.reduce((s, c) => s + c.heuristicScore, 0) / scores.length
                : 0.5;

        return { scores, avgHeuristic, violations };
    }

    trackCalibration(agentId: string, round: number, avgScore: number, wasAccurate: boolean): void {
        let record = this.agentRecords.get(agentId);
        if (!record) {
            record = { rounds: [], overconfidenceCount: 0 };
            this.agentRecords.set(agentId, record);
        }

        const violationType =
            !wasAccurate && avgScore > 0.7
                ? 'overconfident'
                : wasAccurate && avgScore < 0.2
                  ? 'underconfident'
                  : undefined;

        record.rounds.push({ round, avgScore, wasAccurate, violationType });
        if (record.rounds.length > MAX_HISTORY) {
            record.rounds = record.rounds.slice(-MAX_HISTORY);
        }

        if (violationType === 'overconfident') {
            record.overconfidenceCount++;
        }
    }

    getCalibrationPrompt(agentId: string, _round: number, language = 'Russian'): string {
        const record = this.agentRecords.get(agentId);
        if (!record || record.rounds.length === 0) return '';

        const recent = record.rounds.slice(-3);
        const recentOverconfident = recent.filter(
            (r) => r.violationType === 'overconfident',
        ).length;

        const strongWarning = record.overconfidenceCount >= 2;
        const recentMiscue = recentOverconfident >= 1;

        if (!strongWarning && !recentMiscue) return '';

        if (language === 'Russian') {
            const warning = strongWarning
                ? 'ВНИМАНИЕ: Вы систематически завышаете уверенность в своих утверждениях. '
                : '';
            const recentWarn = recentMiscue
                ? 'В предыдущих раундах ваша уверенность превышала обоснованность утверждений. '
                : '';
            return (
                '\n\n### Калибровка уверенности (ABSOLUTE)\n' +
                warning +
                recentWarn +
                'Оценивайте каждое утверждение по шкале: certain (0.95), likely (0.7), possible (0.5), unlikely (0.3), impossible (0.05). ' +
                'Завышенная уверенность при ошибке снижает ваш social capital. ' +
                'Лучше сказать "возможно" и оказаться правым, чем "определенно" и ошибиться.'
            );
        }

        return (
            '\n\n### Confidence Calibration (ABSOLUTE)\n' +
            (strongWarning
                ? 'WARNING: You systematically overstate confidence in your claims. '
                : '') +
            (recentMiscue
                ? 'In prior rounds your confidence exceeded your evidence support. '
                : '') +
            'Rate each claim: certain (0.95), likely (0.7), possible (0.5), unlikely (0.3), impossible (0.05). ' +
            'Overconfidence when wrong reduces your social capital. ' +
            'Better to say "possible" and be right than "certain" and be wrong.'
        );
    }

    clearSession(): void {
        this.agentRecords.clear();
    }
}
