import type { TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';

export interface ContradictionFinding {
    unitAId: string;
    unitBId: string;
    terms: string[];
    reason: string;
    confidence: number;
    detectedAt: string;
}

const STOP_WORDS = new Set([
    'the',
    'a',
    'an',
    'of',
    'and',
    'or',
    'to',
    'in',
    'on',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'it',
    'this',
    'that',
    'these',
    'those',
    'for',
    'with',
    'as',
    'at',
    'by',
    'from',
    'into',
    'through',
    'during',
    'и',
    'в',
    'на',
    'с',
    'по',
    'для',
    'из',
    'к',
    'у',
    'о',
    'об',
    'от',
    'что',
    'это',
    'как',
    'так',
    'не',
    'нет',
    'ли',
    'же',
    'бы',
    'а',
    'но',
]);

const CONTRARY_MARKERS = new Set([
    'never',
    'cannot',
    'refutes',
    'contradicts',
    'denies',
    'fails',
    'исключает',
    'отрицает',
    'противоречит',
    'опровергает',
    'невозможно',
    'неверно',
    'ошибочно',
    'нельзя',
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function hasContraryMarker(text: string): boolean {
    const lower = text.toLowerCase();
    for (const marker of CONTRARY_MARKERS) {
        if (lower.includes(marker)) return true;
    }
    return false;
}

/**
 * WikiContradictionDetector — F7: rule-based cross-document contradiction
 * check. Units sharing significant terms, where one side carries a contrary
 * marker, are flagged. Conservative by design to avoid false positives.
 */
export class WikiContradictionDetector {
    detect(units: TWikiKnowledgeUnit[]): ContradictionFinding[] {
        const findings: ContradictionFinding[] = [];
        const now = new Date().toISOString();
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const a = units[i]!;
                const b = units[j]!;
                if (a.id === b.id) continue;
                const ta = tokenize(a.text);
                const tb = tokenize(b.text);
                const terms = new Set(ta.filter((t) => tb.includes(t)));
                if (terms.size < 2) continue;
                const aNeg = hasContraryMarker(a.text);
                const bNeg = hasContraryMarker(b.text);
                if (aNeg !== bNeg) {
                    findings.push({
                        unitAId: a.id,
                        unitBId: b.id,
                        terms: [...terms].slice(0, 5),
                        reason: aNeg
                            ? 'unit A contradicts shared terms'
                            : 'unit B contradicts shared terms',
                        confidence: 0.55 + Math.min(0.3, terms.size * 0.05),
                        detectedAt: now,
                    });
                }
            }
        }
        return findings;
    }
}
