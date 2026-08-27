// ── Framing Contests Engine (P1.12) ────────────────────────────────────
// Heuristic frame detection via keyword matching. Tracks which frame
// each agent uses each round, surfaces the dominant frame, and lets
// agents challenge or reinforce it in their prompts.

import type { IFrameTracker, FrameType, FrameEntry } from '../../contracts/debate-frame-tracker';

const FRAME_KEYWORDS: Record<FrameType, string[]> = {
    crisis: [
        'crisis',
        'urgent',
        'emergency',
        'threat',
        'disaster',
        'collapse',
        'breaking point',
        '临界',
        'кризис',
        'catastrophe',
        'irreversible',
    ],
    opportunity: [
        'opportunity',
        'potential',
        'breakthrough',
        'promise',
        'benefit',
        'advantage',
        'возможность',
        'chance',
        'growth',
        'innovation',
    ],
    moral: [
        'moral',
        'ethical',
        'right',
        'wrong',
        'justice',
        'fair',
        'unfair',
        'duty',
        'obligation',
        'virtue',
        'conscience',
        'мораль',
        'ethics',
    ],
    economic: [
        'economic',
        'cost',
        'profit',
        'efficiency',
        'market',
        'growth',
        'gdp',
        'revenue',
        'budget',
        'investment',
        'экономик',
        'financial',
    ],
    scientific: [
        'science',
        'research',
        'evidence',
        'study',
        'data',
        'hypothesis',
        'experiment',
        'peer',
        'reproducible',
        'научн',
        'research shows',
    ],
    legal: [
        'legal',
        'law',
        'regulation',
        'compliance',
        'constitutional',
        'statute',
        'jurisdiction',
        'закон',
        'прав',
        'legislation',
    ],
    security: [
        'security',
        'safety',
        'risk',
        'danger',
        'protect',
        'defense',
        'vulnerability',
        'безопасност',
        'secure',
        'safeguard',
    ],
    progress: [
        'progress',
        'future',
        'forward',
        'modernize',
        'advancement',
        'evolution',
        'next generation',
        'прогресс',
        'future-proof',
    ],
    tradition: [
        'tradition',
        'heritage',
        'preserve',
        'convention',
        'legacy',
        'time-tested',
        'традици',
        'heritage',
        'custom',
        'proven',
    ],
    fairness: [
        'fairness',
        'equity',
        'inequality',
        'discrimination',
        'inclusive',
        'равенств',
        'справедлив',
        'bias',
        'marginalized',
        'access',
    ],
    efficiency: [
        'efficiency',
        'optimize',
        'streamline',
        'productivity',
        'waste',
        'lean',
        'automate',
        'эффектив',
        'throughput',
        'bottleneck',
    ],
    risk: [
        'risk',
        'uncertainty',
        'unknown',
        'downside',
        'exposure',
        'volatility',
        'риск',
        'неопределен',
        'gambl',
        'hedge',
    ],
    identity: [
        'identity',
        'culture',
        'community',
        'belonging',
        'values',
        'who we are',
        'идентичн',
        'cultural',
        'lifestyle',
        'heritage',
    ],
    global: [
        'global',
        'international',
        'worldwide',
        'planet',
        'cross-border',
        'глобальн',
        'международ',
        'multilateral',
        'world',
        'earth',
    ],
    local: [
        'local',
        'community',
        'grassroots',
        'regional',
        'municipal',
        'локальн',
        'местн',
        'neighbourhood',
        'citizen',
        'town',
    ],
};

const FRAME_LABELS: Record<FrameType, string> = {
    crisis: 'Crisis / Urgency',
    opportunity: 'Opportunity / Potential',
    moral: 'Moral / Ethical',
    economic: 'Economic / Financial',
    scientific: 'Scientific / Evidence',
    legal: 'Legal / Regulatory',
    security: 'Security / Safety',
    progress: 'Progress / Innovation',
    tradition: 'Tradition / Heritage',
    fairness: 'Fairness / Equity',
    efficiency: 'Efficiency / Optimization',
    risk: 'Risk / Uncertainty',
    identity: 'Identity / Culture',
    global: 'Global / International',
    local: 'Local / Community',
};

function detectFrames(text: string): FrameType[] {
    const lower = text.toLowerCase();
    const found: FrameType[] = [];
    for (const [frame, keywords] of Object.entries(FRAME_KEYWORDS)) {
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                found.push(frame as FrameType);
                break;
            }
        }
    }
    return found;
}

export class FrameTracker implements IFrameTracker {
    private entries: FrameEntry[] = [];

    registerFrame(agentId: string, agentName: string, round: number, content: string): void {
        const frames = detectFrames(content);
        for (const frame of frames) {
            // Find the best keyword match as reasoning snippet
            const lower = content.toLowerCase();
            let reasoning = '';
            for (const kw of FRAME_KEYWORDS[frame]) {
                const idx = lower.indexOf(kw);
                if (idx >= 0) {
                    reasoning = content.slice(Math.max(0, idx - 10), idx + kw.length + 20).trim();
                    break;
                }
            }
            this.entries.push({ agentId, agentName, round, frame, reasoning });
        }
    }

    getDominantFrame(): { frame: FrameType; frequency: number } | null {
        if (this.entries.length === 0) return null;
        const counts = new Map<FrameType, number>();
        for (const e of this.entries) {
            counts.set(e.frame, (counts.get(e.frame) ?? 0) + 1);
        }
        let best: FrameType = 'crisis';
        let bestCount = 0;
        for (const [frame, count] of counts) {
            if (count > bestCount) {
                bestCount = count;
                best = frame;
            }
        }
        return { frame: best, frequency: bestCount / this.entries.length };
    }

    getFramePrompt(language = 'English'): string {
        const dominant = this.getDominantFrame();
        if (!dominant) return '';

        const label = FRAME_LABELS[dominant.frame];
        const pct = Math.round(dominant.frequency * 100);

        if (language === 'Russian') {
            return `### Текущий фрейм дебатов\nДоминирующий фрейм: «${label}» (${pct}% аргументов).\nВы можете УСИЛИТЬ этот фрейм новыми доказательствами или ОСПОРИТЬ его, предложив альтернативный фрейм с обоснованием.`;
        }
        return `### Current Debate Frame\nDominant frame: "${label}" (${pct}% of arguments).\nYou may REINFORCE this frame with new evidence or CHALLENGE it by proposing an alternative frame with justification.`;
    }

    clearSession(): void {
        this.entries = [];
    }
}
