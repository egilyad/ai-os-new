import type { IConsistencyService, Contradiction } from '../../contracts/debate-consistency';

// Jaccard similarity of word sets between two texts
function jaccardText(a: string, b: string): number {
    const norm = (t: string) =>
        new Set(
            t
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 3),
        );
    const aWords = norm(a);
    const bWords = norm(b);
    if (aWords.size < 3 || bWords.size < 3) return 0;
    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
}

// Contradiction markers — phrases that signal the agent is taking an
// opposing stance to the same or similar position
const DIRECT_CONTRADICTION = [
    /\b(but\s+now|however\s*,\s*now|on\s+second\s+thought|actually\s*,\s*i\s+take\s+(that\s+)?back)\b/i,
    /\b(i\s+(was\s+)?wrong\s+(about|before)|i\s+no\s+longer\s+(believe|think|support))\b/i,
    /\b(contrary\s+to\s+(what\s+)?i\s+(said|argued|claimed)\s+(before|earlier))\b/i,
    /\b(хотя\s+раньше\s+я|но\s+теперь\s+я|на\s+самом\s+деле\s+я|вообще-то\s+я)\b/iu,
    /\b(я\s+(был\s+)?неправ\s+(насчёт|про|относительно)|я\s+больше\s+не\s+(считаю|думаю|верю))\b/iu,
    /\b(вопреки\s+моему\s+предыдущему)\b/iu,
];

// Identity markers — phrases that bind to an earlier self-position
const IDENTITY_BINDING = [
    /\b(as\s+i\s+(said|argued|claimed|stated|mentioned)\s+(before|earlier|previously))\b/i,
    /\b(i\s+(maintain|continue\s+to\s+(believe|argue|think)|still\s+(believe|hold|maintain)))\b/i,
    /\b(как\s+я\s+(сказал|утверждал|говорил|отмечал|упоминал)\s+(ранее|раньше|выше))\b/iu,
    /\b(я\s+(по-прежнему|всё\s+ещё)\s+(считаю|полагаю|думаю|придерживаюсь))\b/iu,
];

export class ConsistencyService implements IConsistencyService {
    private agentClaims = new Map<string, Array<{ id: string; content: string; round: number }>>();
    private contradictions = new Map<string, number>(); // agentId → count

    checkConsistency(
        agentId: string,
        _agentName: string,
        currentText: string,
        currentRound: number,
        previousArguments: Array<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
    ): Contradiction[] {
        // Build agent's claim history from previous arguments
        const ownPast = previousArguments.filter(
            (a) => a.agentId === agentId && a.round < currentRound,
        );
        if (ownPast.length === 0) return [];

        // Store in persistent tracking
        if (!this.agentClaims.has(agentId)) {
            this.agentClaims.set(agentId, []);
        }
        const agentHistory = this.agentClaims.get(agentId)!;
        // Add new entries from this round
        for (const arg of ownPast) {
            if (!agentHistory.some((h) => h.id === arg.id)) {
                agentHistory.push({ id: arg.id, content: arg.content, round: arg.round });
            }
        }

        const result: Contradiction[] = [];
        const currentLower = currentText.toLowerCase();

        for (const past of ownPast) {
            const sim = jaccardText(currentText, past.content);

            // High similarity + contradiction markers = likely contradiction
            if (sim >= 0.35 && sim <= 0.85) {
                const hasDirectContradiction = DIRECT_CONTRADICTION.some((p) =>
                    p.test(currentLower),
                );
                const hasIdentityBinding = IDENTITY_BINDING.some((p) => p.test(currentLower));

                // If there's a direct contradiction marker AND no identity binding
                // (which would indicate legitimate evolution or clarification)
                if (hasDirectContradiction && !hasIdentityBinding) {
                    result.push({
                        earlierClaimId: past.id,
                        earlierClaimText: past.content.slice(0, 300),
                        earlierRound: past.round,
                        currentClaimText: currentText.slice(0, 300),
                        similarity: Math.round(sim * 100) / 100,
                        isDirectContradiction: true,
                    });
                }
            }
        }

        if (result.length > 0) {
            this.contradictions.set(
                agentId,
                (this.contradictions.get(agentId) || 0) + result.length,
            );
        }

        return result;
    }

    getConsistencyRatio(agentId: string): number {
        const count = this.contradictions.get(agentId) || 0;
        const agentHistory = this.agentClaims.get(agentId);
        const totalClaims = agentHistory?.length || 1;
        // Ratio: 1 - (contradictions / totalClaims), clamped 0-1
        return Math.max(0, Math.min(1, 1 - count / Math.max(1, totalClaims)));
    }

    reset(): void {
        this.agentClaims.clear();
        this.contradictions.clear();
    }
}
