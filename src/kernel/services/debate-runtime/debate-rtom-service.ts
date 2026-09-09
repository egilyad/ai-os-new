import type { AgentBelief, TheoryOfMindEdge, IRToMGraphService } from '../../contracts/debate-rtom';

export class RToMGraphService implements IRToMGraphService {
    private beliefs = new Map<string, AgentBelief>();
    private edges: TheoryOfMindEdge[] = [];
    private readonly MAX_CLAIMS_PER_AGENT = 5;

    ingestArgument(
        agentId: string,
        _agentName: string,
        content: string,
        round: number,
        _role: string,
    ): void {
        const lower = content.toLowerCase();
        const proSignals =
            /\b(support|agree|benefit|advantage|should|must|pro|favor|за|поддерживаю|согласен|преимущество)\b/;
        const conSignals =
            /\b(against|disagree|risk|drawback|harm|cannot|should not|con|против|возражаю|несогласен|риск|минус)\b/;
        const proCount = (lower.match(proSignals) || []).length;
        const conCount = (lower.match(conSignals) || []).length;
        const total = proCount + conCount || 1;

        const existing = this.beliefs.get(agentId);
        const newProportion = proCount / total;

        if (existing) {
            const stance = newProportion > 0.7 ? 'pro' : newProportion < 0.3 ? 'con' : 'mixed';
            const confidenceDelta = Math.abs(newProportion - 0.5) * 0.2;
            existing.stance = stance;
            existing.confidence = Math.min(1, existing.confidence + confidenceDelta);
            existing.lastUpdatedRound = round;
            const sentences = content.match(/[^.!?]+[.!?]/g) || [content];
            for (const s of sentences.slice(0, 2)) {
                const trimmed = s.trim().slice(0, 120);
                if (!existing.keyClaims.includes(trimmed)) {
                    existing.keyClaims.push(trimmed);
                    if (existing.keyClaims.length > this.MAX_CLAIMS_PER_AGENT) {
                        existing.keyClaims.shift();
                    }
                }
            }
        } else {
            const stance = newProportion > 0.6 ? 'pro' : newProportion < 0.4 ? 'con' : 'neutral';
            const sentences = content.match(/[^.!?]+[.!?]/g) || [content];
            const claims = sentences.slice(0, 2).map((s) => s.trim().slice(0, 120));
            this.beliefs.set(agentId, {
                agentId,
                agentName: _agentName,
                topic: '',
                stance,
                confidence: 0.3 + Math.abs(newProportion - 0.5),
                keyClaims: claims,
                lastUpdatedRound: round,
            });
        }

        this.updateEdges(agentId, content, round);
    }

    private updateEdges(agentId: string, content: string, round: number): void {
        const lower = content.toLowerCase();
        for (const [otherId, otherBelief] of this.beliefs) {
            if (otherId === agentId) continue;
            const nameRef = otherBelief.agentName.toLowerCase();
            if (!lower.includes(nameRef)) continue;

            const nameWords = nameRef.split(/\s+/);
            const isReferencing = nameWords.length > 0 && nameWords.some((w) => lower.includes(w));
            if (!isReferencing) continue;

            const agreementSignals = /\b(agree|support|correct|right|верно|согласен|поддерживаю)\b/;
            const disagreementSignals =
                /\b(disagree|wrong|incorrect|mistaken|неправ|ошибка|несогласен)\b/;

            const agreed = agreementSignals.test(lower) ? 1 : 0;
            const disagreed = disagreementSignals.test(lower) ? 1 : 0;
            const stance =
                agreed > disagreed
                    ? otherBelief.stance
                    : disagreed > agreed
                      ? otherBelief.stance === 'pro'
                          ? 'con'
                          : otherBelief.stance === 'con'
                            ? 'pro'
                            : 'unknown'
                      : 'unknown';
            const confidence = 0.3 + Math.abs(agreed - disagreed) * 0.2;

            const existingIdx = this.edges.findIndex(
                (e) => e.fromAgentId === agentId && e.toAgentId === otherId,
            );
            if (existingIdx >= 0) {
                this.edges[existingIdx] = {
                    ...this.edges[existingIdx]!,
                    inferredStance: stance,
                    confidence: Math.min(1, this.edges[existingIdx]!.confidence + confidence * 0.3),
                    basedOnRounds: [...this.edges[existingIdx]!.basedOnRounds, round],
                };
            } else {
                this.edges.push({
                    fromAgentId: agentId,
                    toAgentId: otherId,
                    inferredStance: stance,
                    confidence,
                    basedOnRounds: [round],
                });
            }
        }
        if (this.edges.length > 200) this.edges = this.edges.slice(-200);
    }

    getToMContext(
        agentId: string,
        _agentName: string,
        round: number,
        _language: string,
    ): string | undefined {
        if (round < 2) return undefined;
        const relevantEdges = this.edges.filter(
            (e) => e.fromAgentId === agentId || e.toAgentId === agentId,
        );
        if (relevantEdges.length === 0) return undefined;

        const lines: string[] = [];
        let added = 0;
        for (const edge of relevantEdges) {
            if (added >= 3) break;
            const otherId = edge.fromAgentId === agentId ? edge.toAgentId : edge.fromAgentId;
            const other = this.beliefs.get(otherId);
            if (!other) continue;
            if (edge.fromAgentId === agentId) {
                const stanceLabel =
                    edge.inferredStance === 'unknown'
                        ? 'has a nuanced position'
                        : edge.inferredStance === 'pro'
                          ? 'supports'
                          : edge.inferredStance === 'con'
                            ? 'opposes'
                            : 'has mixed views on';
                lines.push(
                    `You believe ${other.agentName} ${stanceLabel} the proposition (confidence: ${Math.round(edge.confidence * 100)}%).`,
                );
            } else {
                const stanceLabel =
                    edge.inferredStance === 'unknown'
                        ? 'unsure about your position'
                        : edge.inferredStance === 'pro'
                          ? 'thinks you support'
                          : edge.inferredStance === 'con'
                            ? 'thinks you oppose'
                            : 'sees you as having mixed views on';
                lines.push(
                    `${other.agentName} ${stanceLabel} the proposition (based on your interactions).`,
                );
            }
            if (other.keyClaims.length > 0) {
                lines.push(
                    `  ${other.agentName}'s key claim: "${other.keyClaims[other.keyClaims.length - 1]}"`,
                );
            }
            added++;
        }
        if (added === 0) return undefined;
        return '### Theory of Mind\n' + lines.join('\n');
    }

    getBeliefSummary(_round: number): string {
        if (this.beliefs.size === 0) return '';
        const entries = Array.from(this.beliefs.values());
        const pro = entries.filter((b) => b.stance === 'pro').length;
        const con = entries.filter((b) => b.stance === 'con').length;
        const mixed = entries.filter((b) => b.stance === 'mixed').length;
        const avgConf = entries.reduce((s, b) => s + b.confidence, 0) / entries.length;
        return `Agent belief map: ${pro} pro, ${con} con, ${mixed} mixed. Average conviction: ${Math.round(avgConf * 100)}%.`;
    }

    reset(): void {
        this.beliefs.clear();
        this.edges = [];
    }
}
