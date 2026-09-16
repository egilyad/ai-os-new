import { BELIEF_DETECTION_PATTERNS } from '../../contracts/debate-belief-mining';
import type {
    MinedBelief,
    BeliefConflict,
    BeliefType,
    ConflictType,
    IBeliefMiningService,
} from '../../contracts/debate-belief-mining';

const MAX_BELIEFS_PER_ARGUMENT = 8;
const MAX_CONFLICTS_TO_RETURN = 3;

/**
 * P0.6 Adversarial Belief Mining.
 *
 * Extracts implicit beliefs (values, causal assumptions, epistemic stances,
 * deontic claims, ontological frames) from debate arguments using heuristic
 * pattern matching — no additional LLM calls.
 *
 * Detects cross-agent belief conflicts (value inversions, epistemic
 * divergences, ontological mismatches, causal contradictions) and returns
 * the most severe ones for prompt injection.
 */
export class BeliefMiningService implements IBeliefMiningService {
    extractBeliefs(
        previousArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): MinedBelief[] {
        if (!previousArguments || previousArguments.length === 0) return [];

        const beliefs: MinedBelief[] = [];

        for (const arg of previousArguments) {
            const argBeliefs = this._extractFromText(arg.content, arg);
            beliefs.push(...argBeliefs.slice(0, MAX_BELIEFS_PER_ARGUMENT));
        }

        return beliefs;
    }

    detectConflicts(beliefs: ReadonlyArray<MinedBelief>, _currentRound: number): BeliefConflict[] {
        if (beliefs.length < 2) return [];

        const conflicts: BeliefConflict[] = [];
        const byAgent = this._groupByAgent(beliefs);

        const agentIds = Array.from(byAgent.keys());
        for (let i = 0; i < agentIds.length; i++) {
            for (let j = i + 1; j < agentIds.length; j++) {
                const aBeliefs = byAgent.get(agentIds[i]!)!;
                const bBeliefs = byAgent.get(agentIds[j]!)!;

                const pairConflicts = this._findConflictsBetween(
                    agentIds[i]!,
                    aBeliefs,
                    agentIds[j]!,
                    bBeliefs,
                );
                conflicts.push(...pairConflicts);
            }
        }

        conflicts.sort((a, b) => b.severity - a.severity);
        return conflicts.slice(0, MAX_CONFLICTS_TO_RETURN);
    }

    mineConflicts(
        previousArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
    ): BeliefConflict[] {
        const beliefs = this.extractBeliefs(previousArguments);
        return this.detectConflicts(beliefs, currentRound);
    }

    // ── Private helpers ──

    private _extractFromText(
        text: string,
        source: {
            id: string;
            agentId: string;
            agentName: string;
            round: number;
        },
    ): MinedBelief[] {
        const beliefs: MinedBelief[] = [];
        const seen = new Set<string>();

        const types: BeliefType[] = [
            'value_judgment',
            'causal_assumption',
            'epistemic_stance',
            'deontic_claim',
            'ontological_frame',
        ];

        for (const type of types) {
            const patterns = (BELIEF_DETECTION_PATTERNS as Record<BeliefType, RegExp[]>)[type];
            if (!patterns) continue;

            for (const pat of patterns) {
                const matches = text.matchAll(pat);
                for (const m of matches) {
                    const premise = this._extractPremise(text, m.index ?? 0);
                    if (!premise || seen.has(premise)) continue;
                    seen.add(premise);

                    beliefs.push({
                        agentId: source.agentId,
                        agentName: source.agentName,
                        type,
                        premise,
                        confidence:
                            type === 'value_judgment' || type === 'deontic_claim' ? 0.7 : 0.5,
                        sourceArgumentId: source.id,
                        round: source.round,
                    });
                }
            }
        }

        return beliefs;
    }

    private _extractPremise(text: string, matchIndex: number): string | null {
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(text.length, matchIndex + 120);
        let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();

        // Try to find sentence boundaries
        const before = snippet.indexOf('. ');
        if (before > 10 && matchIndex > start) {
            snippet = snippet.slice(before + 2);
        }
        const after = snippet.indexOf('. ', 100);
        if (after > 50) {
            snippet = snippet.slice(0, after + 1);
        }

        if (snippet.length < 10) return null;
        return snippet;
    }

    private _groupByAgent(beliefs: ReadonlyArray<MinedBelief>): Map<string, MinedBelief[]> {
        const map = new Map<string, MinedBelief[]>();
        for (const b of beliefs) {
            if (!map.has(b.agentId)) map.set(b.agentId, []);
            map.get(b.agentId)!.push(b);
        }
        return map;
    }

    private _findConflictsBetween(
        _agentA: string,
        aBeliefs: MinedBelief[],
        _agentB: string,
        bBeliefs: MinedBelief[],
    ): BeliefConflict[] {
        const conflicts: BeliefConflict[] = [];

        for (const ba of aBeliefs) {
            for (const bb of bBeliefs) {
                // Same belief type → compare
                if (ba.type !== bb.type) continue;

                const overlap = this._wordOverlap(ba.premise, bb.premise);
                if (overlap < 0.15) continue;

                // Determine conflict type based on belief type and content polarity
                const conflictType = this._classifyConflict(ba, bb);
                if (!conflictType) continue;

                const severity = this._computeSeverity(ba, bb, conflictType, overlap);
                const conflict: BeliefConflict = {
                    type: conflictType,
                    agentA: ba.agentName,
                    agentB: bb.agentName,
                    beliefA: ba.premise,
                    beliefB: bb.premise,
                    severity,
                    description: this._buildConflictDescription(conflictType, ba, bb),
                    round: Math.max(ba.round, bb.round),
                };
                conflicts.push(conflict);
            }
        }

        return conflicts;
    }

    private _wordOverlap(a: string, b: string): number {
        const setA = this._wordSet(a);
        const setB = this._wordSet(b);
        if (setA.size < 2 || setB.size < 2) return 0;
        const intersection = new Set([...setA].filter((w) => setB.has(w)));
        const union = new Set([...setA, ...setB]);
        return intersection.size / union.size;
    }

    private _wordSet(text: string): Set<string> {
        return new Set(
            text
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 2),
        );
    }

    private _classifyConflict(ba: MinedBelief, bb: MinedBelief): ConflictType | null {
        const aLower = ba.premise.toLowerCase();
        const bLower = bb.premise.toLowerCase();

        switch (ba.type) {
            case 'value_judgment': {
                const aPositive = this._hasPositiveValence(aLower);
                const bPositive = this._hasPositiveValence(bLower);
                if (aPositive !== bPositive) return 'value_inversion';

                const aHasNegation = /\b(не|но|однако|хотя)\b/i.test(aLower);
                const bHasNegation = /\b(не|но|однако|хотя)\b/i.test(bLower);
                if (aHasNegation !== bHasNegation) return 'value_inversion';
                return null;
            }
            case 'causal_assumption': {
                return 'causal_contradiction';
            }
            case 'epistemic_stance': {
                const aCertain = this._isCertainty(aLower);
                const bCertain = this._isCertainty(bLower);
                if (aCertain !== bCertain) return 'epistemic_divergence';
                return null;
            }
            case 'ontological_frame': {
                return 'ontological_mismatch';
            }
            case 'deontic_claim': {
                // Compare polarity: should vs shouldn't
                const aPositive =
                    !/\b(не|нельзя|запрещено|против|avoid|prevent|forbid|prohibit)\b/i.test(aLower);
                const bPositive =
                    !/\b(не|нельзя|запрещено|против|avoid|prevent|forbid|prohibit)\b/i.test(bLower);
                if (aPositive !== bPositive) return 'value_inversion';
                return null;
            }
            default:
                return null;
        }
    }

    private _hasPositiveValence(text: string): boolean {
        const positiveWords =
            /\b(хорошо|полезно|важно|безопасно|этично|благо|польза|good|beneficial|important|safe|ethical|useful|valuable|positive|advantage|benefit|right|just|fair)\b/i;
        const negativeWords =
            /\b(плохо|вредно|опасно|неэтично|вред|ущерб|bad|harmful|dangerous|unethical|negative|disadvantage|cost|wrong|unjust|unfair|risk|threat)\b/i;
        const pos = (text.match(positiveWords) || []).length;
        const neg = (text.match(negativeWords) || []).length;
        return pos >= neg;
    }

    private _isCertainty(text: string): boolean {
        const certainWords =
            /\b(несомненно|бесспорно|очевидно|доказано|факт|undoubtedly|certainly|proven|established|fact|demonstrated|confirmed|science|research|study|data)\b/i;
        const uncertainWords =
            /\b(неизвестно|неясно|спорно|сомнительно|возможно|perhaps|maybe|uncertain|unclear|disputed|questionable|hypothetical|speculative|might|could|possibly)\b/i;
        const cert = (text.match(certainWords) || []).length;
        const uncert = (text.match(uncertainWords) || []).length;
        return cert >= uncert;
    }

    private _computeSeverity(
        ba: MinedBelief,
        bb: MinedBelief,
        conflictType: ConflictType,
        overlap: number,
    ): number {
        let base = 0.5;

        switch (conflictType) {
            case 'value_inversion':
                base = 0.9;
                break;
            case 'causal_contradiction':
                base = 0.7;
                break;
            case 'epistemic_divergence':
                base = 0.6;
                break;
            case 'ontological_mismatch':
                base = 0.5;
                break;
        }

        const confidenceFactor = (ba.confidence + bb.confidence) / 2;
        const overlapBonus = Math.min(overlap * 0.3, 0.15);
        return Math.min(base + confidenceFactor * 0.1 + overlapBonus, 1.0);
    }

    private _buildConflictDescription(
        conflictType: ConflictType,
        ba: MinedBelief,
        bb: MinedBelief,
    ): string {
        switch (conflictType) {
            case 'value_inversion':
                return `${ba.agentName} values "${ba.premise.slice(0, 80)}" positively, while ${bb.agentName} views the same concept negatively.`;
            case 'causal_contradiction':
                return `${ba.agentName} assumes "${ba.premise.slice(0, 80)}", but ${bb.agentName} has a contradictory causal assumption.`;
            case 'epistemic_divergence':
                return `${ba.agentName} is certain about "${ba.premise.slice(0, 80)}", while ${bb.agentName} questions whether this can be known.`;
            case 'ontological_mismatch':
                return `${ba.agentName} frames "${ba.premise.slice(0, 80)}" fundamentally differently from ${bb.agentName}.`;
        }
    }
}
