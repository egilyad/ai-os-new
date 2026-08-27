import type {
    IAgreementAnchoringService,
    SharedPremise,
} from '../../contracts/debate-agreement-anchoring';

/**
 * AgreementAnchoringService — P0
 * Finds shared premises via trigram overlap across participants.
 * A premise is considered shared if n-gram overlap > threshold between
 * at least two different agents.
 */
export class AgreementAnchoringService implements IAgreementAnchoringService {
    findSharedPremises(
        previousArguments: Array<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
    ): SharedPremise[] {
        if (previousArguments.length < 2) return [];

        // Group by agent, extract trigrams per agent concatenated text
        const byAgent = new Map<string, string>();
        for (const arg of previousArguments) {
            const prev = byAgent.get(arg.agentId) ?? '';
            byAgent.set(arg.agentId, `${prev} ${arg.content}`);
        }

        if (byAgent.size < 2) return [];

        const trigramsPerAgent = new Map<string, Set<string>>();
        for (const [agentId, text] of byAgent) {
            trigramsPerAgent.set(agentId, this.extractTrigrams(text));
        }

        const agentIds = Array.from(trigramsPerAgent.keys());
        const overlaps = new Map<string, number>(); // trigram -> count of agents containing it
        for (const [, set] of trigramsPerAgent) {
            for (const tri of set) {
                overlaps.set(tri, (overlaps.get(tri) ?? 0) + 1);
            }
        }

        const sharedTrigrams = Array.from(overlaps.entries())
            .filter(([, cnt]) => cnt >= 2)
            .map(([tri]) => tri);

        if (sharedTrigrams.length === 0) return [];

        // Build a readable premise from most frequent shared trigrams context
        // For simplicity, return one premise per shared trigram group
        const premises: SharedPremise[] = [];
        // Deduplicate by picking representative sentence containing the trigram
        const used = new Set<string>();
        for (const tri of sharedTrigrams.slice(0, 5)) {
            if (used.has(tri)) continue;
            used.add(tri);
            // Find participants that contain this trigram
            const participants = agentIds.filter((id) => trigramsPerAgent.get(id)!.has(tri));
            premises.push({
                text: tri,
                participantIds: participants,
                confidence: participants.length / agentIds.length,
            });
        }

        return premises.sort((a, b) => b.confidence - a.confidence);
    }

    private extractTrigrams(text: string): Set<string> {
        const words = text
            .toLowerCase()
            .split(/[^a-zа-яё0-9]+/)
            .filter((w) => w.length > 2);
        const set = new Set<string>();
        for (let i = 0; i < words.length - 2; i++) {
            set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }
        return set;
    }
}
