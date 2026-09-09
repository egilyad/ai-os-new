// ── PersonaDriftDetector (P1.16) ─────────────────────────────────────────
// Heuristic persona consistency monitor: compares each agent argument
// against role markers, persona keywords, and prior vocabulary to detect
// out-of-character drift. No embedding API needed.

import type {
    IPersonaDriftDetector,
    DriftRecord,
    PersonaProfile,
} from '../../contracts/debate-drift';

export const DEFAULT_DRIFT_THRESHOLD = 0.55;
export const MIN_CONTENT_LENGTH = 30;
const MAX_ACCUMULATED_CONTENT = 20;

// ── Role vocabulary markers ──────────────────────────────────────
// Each role has characteristic stance-indicating phrases.
// Presence of these markers = role-consistent, absence = possible drift.

const PRO_MARKERS = [
    'because',
    'therefore',
    'thus',
    'hence',
    'consequently',
    'supports',
    'demonstrates',
    'shows',
    'proves',
    'confirms',
    'evidence',
    'advantage',
    'benefit',
    'strength',
    'positive',
    'effective',
    'successful',
    'superior',
    'stronger',
    'better',
    'потому',
    'поэтому',
    'следовательно',
    'таким образом',
    'поддерживает',
    'доказывает',
    'показывает',
    'подтверждает',
    'преимущество',
    'выгода',
    'сильная сторона',
    'эффективный',
    'успешный',
    'лучше',
    'сильнее',
];

const CON_MARKERS = [
    'however',
    'but',
    'although',
    'nevertheless',
    'nonetheless',
    'against',
    'opposes',
    'contradicts',
    'undermines',
    'weakens',
    'fails',
    'lacks',
    'insufficient',
    'problem',
    'drawback',
    'disadvantage',
    'risk',
    'harm',
    'negative',
    'flaw',
    'однако',
    'но',
    'хотя',
    'тем не менее',
    'не смотря',
    'против',
    'противоречит',
    'подрывает',
    'ослабляет',
    'недостаток',
    'проблема',
    'риск',
    'вред',
    'отрицательный',
    'недостаточно',
    'не хватает',
    'не может',
];

const NEUTRAL_MARKERS = [
    'analyze',
    'examine',
    'consider',
    'evaluate',
    'assess',
    'perspective',
    'aspect',
    'dimension',
    'factor',
    'trade-off',
    'nuance',
    'complexity',
    'balance',
    'both sides',
    'multiple',
    'анализ',
    'рассмотреть',
    'оценить',
    'аспект',
    'перспектива',
    'фактор',
    'компромисс',
    'нюанс',
    'сложность',
    'баланс',
    'обе стороны',
    'различные',
    'измерение',
];

/** Pick the role-appropriate marker set */
function roleMarkers(role: string): string[] {
    if (role === 'pro') return PRO_MARKERS;
    if (role === 'con') return CON_MARKERS;
    if (role === 'neutral') return NEUTRAL_MARKERS;
    return NEUTRAL_MARKERS; // fallback
}

/** Simple tokenizer (lowercase, strip punctuation, split on whitespace). */
function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/<[^>]+>/g, ' ')
            .replace(/[^a-zа-яё0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2),
    );
}

/** Jaccard similarity of two token sets. */
function jaccardTokens(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0;
    let intersection = 0;
    for (const t of a) {
        if (b.has(t)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

/** Extract meaningful keywords from a system prompt (words 4+ chars, deduped). */
function extractKeywords(text: string): string[] {
    const words = text
        .toLowerCase()
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^a-zа-яё0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 4 && t.length <= 30);
    return [...new Set(words)];
}

// ── Service ──────────────────────────────────────────────────────

export class PersonaDriftDetector implements IPersonaDriftDetector {
    private threshold: number;
    private profiles = new Map<string, PersonaProfile>();
    private records = new Map<string, DriftRecord>();

    constructor(threshold = DEFAULT_DRIFT_THRESHOLD) {
        this.threshold = threshold;
    }

    registerPersona(agentId: string, role: string, systemPrompt?: string): void {
        const keywords = systemPrompt ? extractKeywords(systemPrompt) : [];
        this.profiles.set(agentId, {
            agentId,
            role: role || 'neutral',
            keywords,
            accumulatedContent: [],
        });
    }

    recordArgument(agentId: string, round: number, content: string): DriftRecord {
        if (content.length < MIN_CONTENT_LENGTH || !this.profiles.has(agentId)) {
            const record: DriftRecord = {
                agentId,
                round,
                driftScore: 0,
                isDrifting: false,
            };
            this.records.set(`${agentId}:${round}`, record);
            return record;
        }

        const profile = this.profiles.get(agentId)!;
        const tokens = tokenize(content);

        // 1. Role consistency score (0-1): fraction of role markers present
        const markers = roleMarkers(profile.role);
        const textLower = content.toLowerCase();
        let markerHits = 0;
        for (const m of markers) {
            if (textLower.includes(m)) markerHits++;
        }
        const roleScore =
            markers.length > 0
                ? Math.min(1, markerHits / Math.max(1, Math.round(markers.length * 0.15)))
                : 0.5;

        // 2. Persona keyword score (0-1): fraction of persona keywords present
        let keywordHits = 0;
        if (profile.keywords.length > 0) {
            for (const kw of profile.keywords) {
                if (textLower.includes(kw)) keywordHits++;
            }
        }
        const keywordScore =
            profile.keywords.length > 0
                ? Math.min(1, keywordHits / Math.max(1, Math.round(profile.keywords.length * 0.1)))
                : 0.5;

        // 3. Historical consistency (0-1): Jaccard against accumulated vocabulary
        let historyScore = 0.5;
        if (profile.accumulatedContent.length > 0) {
            const allPriorTokens = tokenize(profile.accumulatedContent.join(' '));
            const sim = jaccardTokens(tokens, allPriorTokens);
            // Clamp: too low = drifted topic, too high = stuck. Ideal: around 0.2-0.5
            historyScore = sim < 0.05 ? 0 : sim > 0.7 ? 1 - (sim - 0.7) / 0.3 : 1;
        }

        // Accumulate content for future checks (cap to prevent unbounded growth)
        profile.accumulatedContent.push(content.slice(0, 1000));
        if (profile.accumulatedContent.length > MAX_ACCUMULATED_CONTENT) {
            profile.accumulatedContent.splice(
                0,
                profile.accumulatedContent.length - MAX_ACCUMULATED_CONTENT,
            );
        }

        // Combine: role (0.4), keywords (0.3), history (0.3)
        const combined = roleScore * 0.4 + keywordScore * 0.3 + historyScore * 0.3;
        const driftScore = Math.max(0, Math.min(1, 1 - combined));

        const isDrifting = driftScore >= this.threshold;
        const record: DriftRecord = {
            agentId,
            round,
            driftScore,
            isDrifting,
        };
        this.records.set(`${agentId}:${round}`, record);
        return record;
    }

    getDrift(agentId: string, round: number): DriftRecord | undefined {
        return this.records.get(`${agentId}:${round}`);
    }

    clearSession(): void {
        this.profiles.clear();
        this.records.clear();
    }
}
