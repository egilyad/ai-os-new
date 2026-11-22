/**
 * Human-feedback training deltas (CrewAI-inspired, L1).
 *
 * Aggregates repeated feedback themes per agent and turns them into concrete
 * prompt-improvement suggestions. Produces text patches only — the caller
 * decides whether to apply them to a prompt template.
 */
import type {
    IHumanFeedbackService,
    FeedbackEntry,
    SuggestionDelta,
} from '../../contracts/human-feedback';

let seq = 0;

function themeOf(feedback: string): string {
    const t = feedback.toLowerCase();
    if (/short|concise|brev|крат|короч/.test(t)) return 'conciseness';
    if (/evidence|source|cite|доказат|источник/.test(t)) return 'evidence';
    if (/structure|format|table|структур|формат/.test(t)) return 'structure';
    if (/detail|depth|expand|подроб|глубок/.test(t)) return 'depth';
    if (/tone|style|тон|стиль/.test(t)) return 'tone';
    return 'general';
}

const ADVICE: Record<string, string> = {
    conciseness: 'Keep responses concise; remove redundant phrasing.',
    evidence: 'Cite concrete sources for every non-trivial claim.',
    structure: 'Use a clear structure with headings or tables where useful.',
    depth: 'Provide deeper analysis with concrete examples.',
    tone: 'Match the requested tone and avoid overly formal phrasing.',
    general: 'Address the reviewer feedback explicitly in the next response.',
};

export class HumanFeedbackService implements IHumanFeedbackService {
    private entries: FeedbackEntry[] = [];

    add(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry {
        const full: FeedbackEntry = {
            ...entry,
            id: `fb-${Date.now()}-${++seq}`,
            createdAt: Date.now(),
        };
        this.entries.push(full);
        return full;
    }

    deltas(agentId?: string): SuggestionDelta[] {
        const grouped = new Map<string, { agentId: string; theme: string; n: number }>();
        for (const e of this.entries) {
            if (agentId && e.agentId !== agentId) continue;
            const theme = themeOf(e.feedback);
            const key = `${e.agentId}:${theme}`;
            const g = grouped.get(key) ?? { agentId: e.agentId, theme, n: 0 };
            g.n += 1;
            grouped.set(key, g);
        }
        return [...grouped.values()]
            .map((g) => ({
                agentId: g.agentId,
                theme: g.theme,
                occurrences: g.n,
                suggestion: ADVICE[g.theme] ?? ADVICE['general']!,
            }))
            .sort((a, b) => b.occurrences - a.occurrences);
    }

    improvedPrompt(base: string, agentId: string): string {
        const deltas = this.deltas(agentId).slice(0, 3);
        if (deltas.length === 0) return base;
        return [
            base,
            '',
            '## Learned review guidance',
            ...deltas.map((d) => `- ${d.suggestion}`),
        ].join('\n');
    }
}
