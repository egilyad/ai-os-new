import type {
    EntanglementConstraint,
    EntanglementResponseType,
    IEntanglementEngine,
    ResponseValidationResult,
    AnchorClaim,
    IAnchoringService,
} from '../../contracts/debate-entanglement';
import type { IArgumentGraphService } from '../../contracts/debate-argument-graph';

// ── Helpers ───────────────────────────────────────────────────────────

function normalize(t: string): string {
    return t
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, '')
        .trim();
}

function jaccardWords(a: string, b: string): number {
    const setA = new Set(normalize(a).split(/\s+/).filter(Boolean));
    const setB = new Set(normalize(b).split(/\s+/).filter(Boolean));
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter((w) => setB.has(w)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

function extractClaims(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 25 && !s.startsWith('[') && !s.startsWith('('));
}

/**
 * Score how "addressable" a claim is: prefers claims with clear stance,
 * moderate length (30-200 chars), and not already addressed by this agent.
 */
function scoreAddressability(
    claimText: string,
    agentId: string,
    claimAgentId: string,
    agoRounds: number,
): number {
    if (claimAgentId === agentId) return 0;
    const len = normalize(claimText).split(/\s+/).length;
    if (len < 5 || len > 60) return 0;
    const hasStance = /\b(because|therefore|should|must|evidence|proves|demonstrates)\b/i.test(
        claimText,
    );
    const recencyFactor = Math.max(0, 1 - agoRounds * 0.25);
    return (hasStance ? 2 : 1) * recencyFactor;
}

// ── IEntanglementEngine ───────────────────────────────────────────────

export class EntanglementEngine implements IEntanglementEngine {
    private _graph: IArgumentGraphService | null = null;

    /** Inject an optional unified argument graph. When set, graph-based
     *  traversal replaces the naive text-parsing heuristic. */
    setGraph(graph: IArgumentGraphService | null): void {
        this._graph = graph;
    }

    getConstraint(
        agentId: string,
        _agentName: string,
        allArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
    ): EntanglementConstraint | null {
        // ── Graph path (preferred) ──
        if (this._graph && this._graph.initialized) {
            const candidate = this._graph.findBestConstraint(agentId, currentRound);
            if (candidate) {
                const mappedType = this._mapEdgeType(candidate.type);
                const contextPhrase = `Your opponent ${candidate.node.agentName} stated: "${candidate.node.content.slice(0, 200)}". Address this specific claim directly.`;
                return {
                    mustQuoteOpponent: true,
                    targetClaimId: candidate.node.id,
                    targetClaimText: candidate.node.content,
                    opponentId: candidate.node.agentId,
                    opponentName: candidate.node.agentName,
                    responseType: mappedType,
                    contextPhrase,
                };
            }
        }

        // ── Heuristic path (fallback) ──
        const opponentArgs = allArguments.filter((a) => a.agentId !== agentId);
        if (opponentArgs.length === 0) return null;

        const thisAgentLatestRound = Math.max(
            0,
            ...allArguments.filter((a) => a.agentId === agentId).map((a) => a.round),
        );

        let bestClaim: (typeof opponentArgs)[0] | null = null;
        let bestScore = -1;

        for (const arg of opponentArgs) {
            const claims = extractClaims(arg.content);
            for (const claimText of claims) {
                const agoRounds = currentRound - arg.round;
                const score = scoreAddressability(claimText, agentId, arg.agentId, agoRounds);

                const alreadyAddressed = allArguments.some(
                    (a) =>
                        a.agentId === agentId &&
                        a.round > arg.round &&
                        jaccardWords(a.content, claimText) > 0.25,
                );

                if (!alreadyAddressed && score > bestScore) {
                    bestScore = score;
                    bestClaim = { ...arg, content: claimText };
                }
            }
        }

        if (!bestClaim || bestScore <= 0) return null;

        const isAdversarial =
            /\b(wrong|incorrect|flawed|misleading|false|mistake|error|problem|issue|fail)\b/i.test(
                bestClaim.content,
            );
        const responseType: EntanglementResponseType = isAdversarial ? 'support' : 'rebut';

        const contextPhrase =
            thisAgentLatestRound <= 1
                ? `This is a key claim from ${bestClaim.agentName} that needs a direct response.`
                : `Your opponent ${bestClaim.agentName} stated: "${bestClaim.content.slice(0, 200)}". Address this specific claim directly.`;

        return {
            mustQuoteOpponent: true,
            targetClaimId: bestClaim.id,
            targetClaimText: bestClaim.content,
            opponentId: bestClaim.agentId,
            opponentName: bestClaim.agentName,
            responseType,
            contextPhrase,
        };
    }

    /** Map graph edge type to entanglement response type. */
    private _mapEdgeType(
        t: import('../../contracts/debate-argument-graph').ArgumentEdgeType,
    ): EntanglementResponseType {
        switch (t) {
            case 'attacks':
            case 'evidence_against':
                return 'rebut';
            case 'supports':
            case 'evidence_for':
                return 'support';
            case 'refines':
            case 'questions':
            case 'responds_to':
                return 'refine';
            case 'duplicates':
                return 'support';
        }
    }

    validateEntanglement(
        response: string,
        constraint: EntanglementConstraint,
    ): ResponseValidationResult {
        const responseNorm = normalize(response);
        const targetWords = normalize(constraint.targetClaimText).split(/\s+/).filter(Boolean);

        // Check if response contains key terms from the target claim
        const significantWords = targetWords.filter((w) => w.length > 4);
        const matchedWords = significantWords.filter((w) => responseNorm.includes(w));
        const wordOverlap =
            significantWords.length > 0 ? matchedWords.length / significantWords.length : 0;

        // Check for explicit reference patterns
        const hasExplicitRef =
            /\b(as\s+(you|they)\s+(said|stated|argued|claimed|noted)|вы\s+(сказали|утверждали|отметили|заявили)|согласно\s+(вашему|вашей)|opponent\s+(said|stated|claimed|argued))\b/i.test(
                response,
            );

        const similarityToTarget = jaccardWords(response, constraint.targetClaimText);

        const engaged = hasExplicitRef || wordOverlap > 0.15 || similarityToTarget > 0.2;

        const reasons: string[] = [];
        if (!hasExplicitRef) reasons.push('no_explicit_reference_to_opponent');
        if (wordOverlap <= 0.15) reasons.push('low_term_overlap_with_target');

        return {
            engaged,
            reason: engaged ? undefined : reasons.join(', '),
            similarityToTarget,
        };
    }
}

// ── IAnchoringService (P0.5) ──────────────────────────────────────────

export class AnchoringService implements IAnchoringService {
    private _graph: IArgumentGraphService | null = null;

    /** Inject an optional unified argument graph. */
    setGraph(graph: IArgumentGraphService | null): void {
        this._graph = graph;
    }

    extractAnchors(
        allArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
        minRoundsForAnchor = 3,
    ): AnchorClaim[] {
        if (currentRound < minRoundsForAnchor + 2) return [];

        // ── Graph path (preferred) ──
        if (this._graph && this._graph.initialized) {
            const unattacked = this._graph.getUnattackedClaims(currentRound, minRoundsForAnchor);
            return unattacked.slice(0, 10).map((u) => ({
                claimId: u.node.id,
                agentName: u.node.agentName,
                text: u.node.content,
                roundResolved: u.node.round,
                confidence: u.node.confidence,
            }));
        }

        // ── Heuristic path (fallback) ──
        const byAgent = new Map<
            string,
            Array<{
                id: string;
                agentId: string;
                agentName: string;
                content: string;
                round: number;
            }>
        >();
        for (const arg of allArguments) {
            const list = byAgent.get(arg.agentId) || [];
            list.push({ ...arg });
            byAgent.set(arg.agentId, list);
        }

        const agentIds = Array.from(byAgent.keys());
        const anchors: AnchorClaim[] = [];

        for (const [agentId, args] of byAgent) {
            for (const arg of args) {
                const claims = extractClaims(arg.content);
                for (const claimText of claims) {
                    const subsequentRounds = allArguments.filter(
                        (a) => a.agentId !== agentId && a.round > arg.round,
                    );
                    const challenged = subsequentRounds.some(
                        (a) => jaccardWords(a.content, claimText) > 0.2,
                    );

                    const roundsSince = currentRound - arg.round;
                    const otherAgentsCount = agentIds.filter((id) => id !== agentId).length;

                    if (
                        !challenged &&
                        roundsSince >= minRoundsForAnchor &&
                        otherAgentsCount > 0 &&
                        normalize(claimText).split(/\s+/).length >= 5
                    ) {
                        anchors.push({
                            claimId: arg.id,
                            agentName: arg.agentName,
                            text: claimText,
                            roundResolved: arg.round,
                            confidence: 0.85,
                        });
                    }
                }
            }
        }

        const unique: AnchorClaim[] = [];
        for (const anchor of anchors) {
            const isDuplicate = unique.some((u) => jaccardWords(u.text, anchor.text) > 0.35);
            if (!isDuplicate) unique.push(anchor);
        }

        return unique.slice(0, 10);
    }

    buildDeltaPrompt(anchors: AnchorClaim[], language = 'Russian'): string {
        if (anchors.length === 0) return '';

        const lines = anchors.map(
            (a, i) =>
                `  ${i + 1}. [${a.agentName}]: "${a.text.slice(0, 160)}" (established round ${a.roundResolved})`,
        );

        const langInstruction =
            language === 'Russian'
                ? 'HE повторяйте эти пункты и не возвращайтесь к ним. Если оппонент пытается их переоткрыть — напомните, что они уже согласованы.'
                : 'Do NOT repeat these points or reopen them. If an opponent tries to reopen, remind them these are already agreed.';

        return `

### ✅ Anchored Common Ground (Do NOT re-argue)
The following claims have been established and NOT challenged for several rounds. They are now common ground:
${lines.join('\n')}

${langInstruction}

Focus EXCLUSIVELY on the remaining unresolved points.`;
    }
}
