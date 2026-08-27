import type {
    Claim,
    Conflict,
    ConsensusResult,
    IConsensusEngine,
    ParticipantConfig,
    ReasoningChain,
} from '../../contracts/debate-runtime';
import { getFNVEmbedding, cosineSimilarity } from '../../utils/embedding';

export interface MemoryAccess {
    getChain(agentId: string): ReasoningChain[];
}

export function gatherClaims(
    sessionId: string,
    participants: ParticipantConfig[],
    getMemory: (sessionId: string) => MemoryAccess,
    currentRound: number,
): Claim[] {
    const claims: Claim[] = [];
    const memory = getMemory(sessionId);
    for (const participant of participants) {
        const chains = memory.getChain(participant.agentId);
        for (const chain of chains) {
            for (const step of chain.steps) {
                if (step.type === 'claim') {
                    claims.push({
                        id: `${step.agentId}-${step.timestamp}`,
                        text: step.content,
                        agentId: step.agentId,
                        round: step.round ?? currentRound,
                        confidence: step.confidence,
                        speaker: participant.agentId,
                        role: participant.role ?? '',
                    });
                }
            }
        }
    }
    return claims;
}

export class DebateConsensusEngine implements IConsensusEngine {
    private confidenceGraph = new Map<string, { value: number; lastAccess: number }>();
    private embeddingCache = new Map<string, number[]>();
    private static readonly MAX_CACHE = 500;
    private static readonly MAX_GRAPH = 500;
    /** Claims-hash-based result cache — skips O(n²) recomputation when same claims set is re-evaluated */
    private lastClaimsHash: string | null = null;
    private lastResult: ConsensusResult | null = null;

    evaluate(claims: Claim[]): ConsensusResult {
        const hash = claims.map((c) => `${c.id}:${c.confidence.toFixed(3)}`).join('|');
        if (hash === this.lastClaimsHash && this.lastResult) return this.lastResult;
        this.lastClaimsHash = hash;

        const agreements = this.findAgreements(claims);
        const rawConflicts = this.findConflicts(claims);
        const conflicts = rawConflicts.map((c) => {
            const gap = Math.abs(c.claimA.confidence - c.claimB.confidence);
            if (gap >= 0.3) {
                const winner = c.claimA.confidence > c.claimB.confidence ? c.claimA : c.claimB;
                return this.resolveConflict(
                    c,
                    `Higher confidence claim from ${winner.agentId} preferred (gap=${gap.toFixed(2)})`,
                );
            }
            return c;
        });
        const unresolved = this.findUnresolved(claims, conflicts);
        const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
        const contradictionDensity =
            claims.length > 0 ? unresolvedConflicts.length / claims.length : 0;
        const confidence = this.calculateConfidence(agreements, conflicts, claims);

        const result: ConsensusResult = {
            agreements,
            conflicts,
            unresolved,
            confidence,
            contradictionDensity,
        };
        this.lastResult = result;
        return result;
    }

    resolveConflict(conflict: Conflict, resolution: string): Conflict {
        if (this.confidenceGraph.size >= DebateConsensusEngine.MAX_GRAPH) {
            let oldestKey: string | undefined;
            let oldestTime = Infinity;
            for (const [key, entry] of this.confidenceGraph) {
                if (entry.lastAccess < oldestTime) {
                    oldestTime = entry.lastAccess;
                    oldestKey = key;
                }
            }
            if (oldestKey) this.confidenceGraph.delete(oldestKey);
        }
        this.confidenceGraph.set(`${conflict.claimA.id}-${conflict.claimB.id}`, {
            value: (conflict.claimA.confidence + conflict.claimB.confidence) / 2,
            lastAccess: Date.now(),
        });
        return { ...conflict, resolved: true, resolution };
    }

    destroy(): void {
        this.confidenceGraph.clear();
        this.embeddingCache.clear();
        this.lastClaimsHash = null;
        this.lastResult = null;
    }

    getConfidenceGraph(): Map<string, number> {
        const result = new Map<string, number>();
        for (const [key, entry] of this.confidenceGraph) {
            result.set(key, entry.value);
        }
        return result;
    }

    private findAgreements(claims: Claim[]): Claim[] {
        const agreementThreshold = 0.6;
        const agreements: Claim[] = [];
        const grouped = new Set<number>();

        if (claims.length < 2) return agreements;

        const embeddings = claims.map((c) => {
            const cacheKey = c.text.slice(0, 100) + ':' + c.text.length;
            let emb = this.embeddingCache.get(cacheKey);
            if (!emb) {
                emb = getFNVEmbedding(c.text);
                // DR-11: Enforce cache limit
                if (this.embeddingCache.size >= DebateConsensusEngine.MAX_CACHE) {
                    const firstKey = this.embeddingCache.keys().next().value;
                    if (firstKey) this.embeddingCache.delete(firstKey);
                }
                this.embeddingCache.set(cacheKey, emb);
            }
            return emb;
        });

        for (let i = 0; i < claims.length; i++) {
            if (grouped.has(i)) continue;
            const group: Claim[] = [claims[i]!];
            grouped.add(i);
            for (let j = i + 1; j < claims.length; j++) {
                if (grouped.has(j)) continue;
                const similarity = cosineSimilarity(embeddings[i]!, embeddings[j]!);
                if (similarity >= agreementThreshold) {
                    group.push(claims[j]!);
                    grouped.add(j);
                }
            }
            if (group.length >= 2) {
                const avgConfidence = group.reduce((s, c) => s + c.confidence, 0) / group.length;
                agreements.push({ ...group[0]!, confidence: avgConfidence });
            }
        }
        return agreements;
    }

    private findConflicts(claims: Claim[]): Conflict[] {
        const conflicts: Conflict[] = [];
        for (let i = 0; i < claims.length; i++) {
            for (let j = i + 1; j < claims.length; j++) {
                const a = claims[i]!;
                const b = claims[j]!;
                if (a.agentId !== b.agentId && this.isContradictory(a, b)) {
                    conflicts.push({
                        id: `conflict-${a.id}-${b.id}`,
                        claimA: a,
                        claimB: b,
                        resolved: false,
                    });
                }
            }
        }
        return conflicts;
    }

    private findUnresolved(claims: Claim[], conflicts: Conflict[]): string[] {
        const conflictClaimIds = new Set<string>();
        for (const c of conflicts) {
            conflictClaimIds.add(c.claimA.id);
            conflictClaimIds.add(c.claimB.id);
        }
        return claims
            .filter((c) => !conflictClaimIds.has(c.id))
            .filter((c) => c.confidence < 0.5)
            .map((c) => c.text);
    }

    private calculateConfidence(
        agreements: Claim[],
        conflicts: Conflict[],
        claims: Claim[],
    ): number {
        if (claims.length === 0) return 0;
        const agreementScore =
            agreements.reduce((s, a) => s + a.confidence, 0) / Math.max(1, agreements.length);
        const unresolvedConflicts = conflicts.filter((c) => !c.resolved).length;
        const resolvedConflicts = conflicts.length - unresolvedConflicts;
        const rawPenalty = unresolvedConflicts / claims.length;
        const resolvedBonus = (resolvedConflicts / Math.max(1, claims.length)) * 0.1;
        const conflictPenalty = Math.max(0, rawPenalty * 0.3 - resolvedBonus);
        const avgClaimConfidence = claims.reduce((s, c) => s + c.confidence, 0) / claims.length;
        return Math.max(
            0,
            Math.min(1, (agreementScore + avgClaimConfidence) / 2 - conflictPenalty),
        );
    }

    private tokenize(text: string): Set<string> {
        return new Set(
            text
                .toLowerCase()
                .split(/[^a-zа-яё0-9]+/)
                .filter(Boolean),
        );
    }

    private isContradictory(a: Claim, b: Claim): boolean {
        const tokensA = this.tokenize(a.text);
        const tokensB = this.tokenize(b.text);

        const negationWords = [
            'not',
            'never',
            'cannot',
            'disagree',
            'incorrect',
            'false',
            'wrong',
            'не',
            'нет',
            'никогда',
            'нельзя',
            'невозможно',
            'неправильно',
            'ложно',
        ];
        const hasNegationMismatch = negationWords.some((n) => tokensA.has(n) !== tokensB.has(n));
        if (hasNegationMismatch) return true;

        const antonymPairs = [
            ['high', 'low'],
            ['hot', 'cold'],
            ['true', 'false'],
            ['yes', 'no'],
            ['positive', 'negative'],
            ['increase', 'decrease'],
            ['up', 'down'],
            ['good', 'bad'],
            ['right', 'wrong'],
            ['start', 'stop'],
            ['win', 'lose'],
            ['success', 'failure'],
            ['accept', 'reject'],
            ['approve', 'deny'],
            ['allow', 'forbid'],
            ['support', 'oppose'],
            ['for', 'against'],
            ['always', 'never'],
            ['да', 'нет'],
            ['за', 'против'],
            ['высокий', 'низкий'],
            ['можно', 'нельзя'],
            ['хороший', 'плохой'],
            ['правильно', 'неправильно'],
            ['большой', 'маленький'],
            ['много', 'мало'],
            ['быстро', 'медленно'],
            ['дорогой', 'дешёвый'],
            ['дешевый', 'дорогой'],
            ['увеличить', 'уменьшить'],
            ['начать', 'закончить'],
            ['плюс', 'минус'],
            ['достоинство', 'недостаток'],
            ['преимущество', 'недостаток'],
            ['согласен', 'возражаю'],
            ['поддерживаю', 'отвергаю'],
            ['верно', 'неверно'],
        ];
        let antonymCount = 0;
        for (const pair of antonymPairs) {
            const aWord = pair[0]!;
            const bWord = pair[1]!;
            if (tokensA.has(aWord) && tokensB.has(bWord)) antonymCount++;
            if (tokensB.has(aWord) && tokensA.has(bWord)) antonymCount++;
        }
        if (antonymCount >= 2) return true;

        const numRegex =
            /(\d+(?:\.\d+)?)\s*(dollars|percent|degrees|ms|mb|gb|s|h|kg|miles|km|руб|доллар|процент)?\b/g;
        const aNums = [...a.text.toLowerCase().matchAll(numRegex)].map((m) => ({
            val: parseFloat(m[1]!),
            unit: m[2] || '',
        }));
        const bNums = [...b.text.toLowerCase().matchAll(numRegex)].map((m) => ({
            val: parseFloat(m[1]!),
            unit: m[2] || '',
        }));
        for (const an of aNums) {
            for (const bn of bNums) {
                if (an.unit === bn.unit && an.unit !== '' && an.val !== bn.val) return true;
            }
        }

        return false;
    }
}
