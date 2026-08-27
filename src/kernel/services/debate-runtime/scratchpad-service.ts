// ── Scratchpad Service (P2.11) ──────────────────────────────────
// Heuristic tactical analysis before argument generation.
// No LLM calls — pure analysis of existing argument patterns.

import type { IScratchpadService, ScratchpadAnalysis } from '../../contracts/debate-scratchpad';

// Keywords that indicate an argument was challenged
const CHALLENGE_MARKERS = [
    /\b(but|however|nevertheless|although|yet|while)\b/i,
    /\b(однако|но|хотя|тем не менее|в то время как)\b/iu,
    /\b(wrong|incorrect|flaw|mistake|disagree|fails|problem|issue)\b/i,
    /\b(неправ|неверн|ошибк|проблем|недостат)\b/iu,
    /\b(what about|what if|how about|why should|why would)\b/i,
    /\b(а как же|а что если|почему)\b/iu,
];

function findUnchallengedArgs(
    agentId: string,
    history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
    round: number,
): Array<{ agentName: string; content: string; round: number }> {
    // Group arguments by round, sorted
    const byRound = new Map<number, typeof history>();
    for (const entry of history) {
        if (entry.agentId === agentId) continue; // skip our own
        const existing = byRound.get(entry.round) || [];
        existing.push(entry);
        byRound.set(entry.round, existing);
    }

    const unchallenged: Array<{ agentName: string; content: string; round: number }> = [];

    for (const [rnd, entries] of byRound) {
        if (rnd >= round) continue;

        for (const entry of entries) {
            // Check if this entry was challenged in a later round
            const laterEntries = history.filter(
                (h) => h.round > rnd && h.agentId !== entry.agentId,
            );
            const wasChallenged = laterEntries.some((h) =>
                CHALLENGE_MARKERS.some((m) => m.test(h.content)),
            );

            if (!wasChallenged) {
                unchallenged.push({
                    agentName: entry.agentName,
                    content: entry.content.slice(0, 200),
                    round: rnd,
                });
            }
        }
    }

    return unchallenged.slice(0, 3);
}

function findContradictions(
    agentId: string,
    history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
): Array<{ agentName: string; point1: string; point2: string }> {
    const otherArgs = history.filter((h) => h.agentId !== agentId);
    const contradictions: Array<{ agentName: string; point1: string; point2: string }> = [];

    // Simple heuristic: look for opposing statements by the same agent
    const byAgent = new Map<string, string[]>();
    for (const entry of otherArgs) {
        const existing = byAgent.get(entry.agentName) || [];
        existing.push(entry.content);
        byAgent.set(entry.agentName, existing);
    }

    const OPPOSITION_PAIRS = [
        [/\b(market|free market|deregulation)\b/i, /\b(regulation|government|state control)\b/i],
        [/\b(freedom|liberty|autonomy)\b/i, /\b(security|safety|protection)\b/i],
        [/\b(efficiency|growth|productivity)\b/i, /\b(equity|fairness|equality)\b/i],
        [/\b(individual|personal|private)\b/i, /\b(collective|public|social|communal)\b/i],
    ];

    for (const [name, texts] of byAgent) {
        for (let i = 0; i < texts.length - 1; i++) {
            for (let j = i + 1; j < texts.length; j++) {
                for (const [leftPat, rightPat] of OPPOSITION_PAIRS) {
                    const hasLeft = leftPat!.test(texts[i]!) || leftPat!.test(texts[j]!);
                    const hasRight = rightPat!.test(texts[i]!) || rightPat!.test(texts[j]!);
                    if (hasLeft && hasRight) {
                        contradictions.push({
                            agentName: name,
                            point1: texts[i]!.slice(0, 120),
                            point2: texts[j]!.slice(0, 120),
                        });
                        break;
                    }
                }
                if (contradictions.length >= 2) break;
            }
            if (contradictions.length >= 2) break;
        }
        if (contradictions.length >= 2) break;
    }

    return contradictions;
}

export class ScratchpadService implements IScratchpadService {
    analyze(
        agentId: string,
        _agentRole: string,
        round: number,
        history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
        _topic: string,
        language: string,
    ): ScratchpadAnalysis {
        const unchallenged = findUnchallengedArgs(agentId, history, round);
        const contradictions = findContradictions(agentId, history);

        const weaknesses = unchallenged.map(
            (u) => `${u.agentName} (round ${u.round}): "${u.content}"`,
        );

        const opportunities: string[] = [];
        if (unchallenged.length > 0) {
            opportunities.push(
                `Attack unchallenged arguments: ${unchallenged.map((u) => u.agentName).join(', ')} made points that were never rebutted.`,
            );
        }
        if (contradictions.length > 0) {
            for (const c of contradictions) {
                opportunities.push(
                    `Exploit contradiction in ${c.agentName}: they argued both sides on the same issue.`,
                );
            }
        }
        if (opportunities.length === 0) {
            opportunities.push('Reinforce your strongest argument with additional evidence.');
        }

        const tacticalFocus = opportunities[0] || 'Press the strongest line of argument.';

        if (language.startsWith('ru')) {
            const weaknessText =
                weaknesses.length > 0
                    ? `Неопровергнутые аргументы оппонента:\n${weaknesses.map((w) => `- ${w}`).join('\n')}`
                    : '';
            const contradictionText =
                contradictions.length > 0
                    ? `\nПротиворечия оппонента:\n${contradictions.map((c) => `- ${c.agentName}: "${c.point1.slice(0, 80)}..." vs "${c.point2.slice(0, 80)}..."`).join('\n')}`
                    : '';
            const promptBlock = `### Тактический анализ\n${weaknessText}${contradictionText}\nРекомендация: ${tacticalFocus}`;
            return { weaknesses, opportunities, tacticalFocus, promptBlock };
        }

        const weaknessText =
            weaknesses.length > 0
                ? `Unchallenged opponent arguments:\n${weaknesses.map((w) => `- ${w}`).join('\n')}`
                : '';
        const contradictionText =
            contradictions.length > 0
                ? `\nOpponent contradictions:\n${contradictions.map((c) => `- ${c.agentName}: "${c.point1.slice(0, 80)}..." vs "${c.point2.slice(0, 80)}..."`).join('\n')}`
                : '';
        const promptBlock = `### Tactical Analysis\n${weaknessText}${contradictionText}\nRecommendation: ${tacticalFocus}`;

        return { weaknesses, opportunities, tacticalFocus, promptBlock };
    }
}
