import type {
    ArgumentNode,
    ArgumentEdge,
    ArgumentEdgeType,
    ArgumentGraphStats,
    UnattackedClaim,
    ConstraintCandidate,
    GraphBuildInput,
    IArgumentGraphService,
    EdgeDetectionMethod,
} from '../../contracts/debate-argument-graph';

// ── Text Helpers ───────────────────────────────────────────────────────

function normalize(t: string): string {
    return t
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, '')
        .trim();
}

function wordSet(t: string): Set<string> {
    return new Set(normalize(t).split(/\s+/).filter(Boolean));
}

function jaccardWords(a: string, b: string): number {
    const setA = wordSet(a);
    const setB = wordSet(b);
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter((w) => setB.has(w)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

const ADVERSARIAL_WORDS =
    /\b(wrong|incorrect|flawed|misleading|false|mistake|error|problem|issue|fail|untrue|invalid|faulty|weak|unsupported|fallacy|contradicts|refutes|disproves|disagree|however|but|on the contrary|nevertheless|неверно|ошибочно|опровергаю|несогласен|однако|но|напротив)\b/i;

const SUPPORTIVE_WORDS =
    /\b(agree|correct|right|true|valid|strong|supported|evidence|proves|demonstrates|confirms|reinforces|indeed|similarly|likewise|furthermore|moreover|согласен|верно|правильно|доказывает|подтверждает|действительно|также|кроме того)\b/i;

const KEYWORD_LENGTH_THRESHOLD = 5;

function hasAdversarialLanguage(text: string): boolean {
    return ADVERSARIAL_WORDS.test(text);
}

function hasSupportiveLanguage(text: string): boolean {
    return SUPPORTIVE_WORDS.test(text);
}

function significantWords(t: string): string[] {
    return normalize(t)
        .split(/\s+/)
        .filter((w) => w.length >= KEYWORD_LENGTH_THRESHOLD);
}

// ── Edge Detection ─────────────────────────────────────────────────────

interface DetectedEdge {
    targetId: string;
    type: ArgumentEdgeType;
    confidence: number;
    method: EdgeDetectionMethod;
}

function detectEdge(current: GraphBuildInput, earlier: GraphBuildInput): DetectedEdge | null {
    // Explicit parent link
    if (current.parentId && current.parentId === earlier.id) {
        return {
            targetId: earlier.id,
            type: 'responds_to',
            confidence: 1.0,
            method: 'explicit_parent',
        };
    }

    // Explicit duplicate
    if (current.duplicateOf && current.duplicateOf === earlier.id) {
        return {
            targetId: earlier.id,
            type: 'duplicates',
            confidence: 1.0,
            method: 'explicit_parent',
        };
    }

    const similarity = jaccardWords(current.content, earlier.content);

    // High similarity → duplicate
    if (similarity > 0.6) {
        return {
            targetId: earlier.id,
            type: 'duplicates',
            confidence: Math.min(similarity, 0.95),
            method: 'jaccard_duplicate',
        };
    }

    // Moderate similarity → attack/support/refine
    if (similarity > 0.12) {
        const adversarial = hasAdversarialLanguage(current.content);
        const supportive = hasSupportiveLanguage(current.content);

        if (adversarial && !supportive) {
            return {
                targetId: earlier.id,
                type: 'attacks',
                confidence: similarity,
                method: 'jaccard_attack',
            };
        }
        if (supportive && !adversarial) {
            return {
                targetId: earlier.id,
                type: 'supports',
                confidence: similarity,
                method: 'jaccard_support',
            };
        }
        // Both or neither
        if (adversarial && supportive) {
            if (similarity > 0.25) {
                return {
                    targetId: earlier.id,
                    type: 'attacks',
                    confidence: similarity * 0.7,
                    method: 'jaccard_attack',
                };
            }
        }
    }

    // Low overall similarity but shared significant words → refine/question
    const currentSig = significantWords(current.content);
    const earlierSig = significantWords(earlier.content);
    if (currentSig.length > 0 && earlierSig.length > 0) {
        const shared = currentSig.filter((w) => earlierSig.includes(w));
        const sharedRatio = shared.length / Math.max(currentSig.length, earlierSig.length);
        if (sharedRatio > 0.3) {
            return {
                targetId: earlier.id,
                type: 'refines',
                confidence: sharedRatio * 0.6,
                method: 'same_topic',
            };
        }
    }

    return null;
}

// ── Graph Service ──────────────────────────────────────────────────────

const MAX_COMPARISONS = 5000;

export class ArgumentGraphService implements IArgumentGraphService {
    private _nodes = new Map<string, ArgumentNode>();
    private _allEdges: ArgumentEdge[] = [];
    private _outEdges = new Map<string, ArgumentEdge[]>();
    private _inEdges = new Map<string, ArgumentEdge[]>();
    private _nodeOrder: string[] = [];
    private _built = false;

    get initialized(): boolean {
        return this._built;
    }

    build(args: ReadonlyArray<GraphBuildInput>): void {
        this.clear();

        if (args.length === 0) return;

        // Build nodes
        for (const a of args) {
            this._nodes.set(a.id, {
                id: a.id,
                agentId: a.agentId,
                agentName: a.agentName,
                content: a.content,
                round: a.round,
                timestamp: a.timestamp,
                confidence: a.confidence,
                position: a.position,
                sourceArgumentId: a.id,
            });
            this._nodeOrder.push(a.id);
        }

        // Detect edges
        let comparisons = 0;
        for (let i = 0; i < args.length && comparisons < MAX_COMPARISONS; i++) {
            const current = args[i]!;
            for (let j = i - 1; j >= 0 && comparisons < MAX_COMPARISONS; j--) {
                const earlier = args[j]!;

                // Only compare across different agents (same agent doesn't attack itself)
                if (current.agentId === earlier.agentId) continue;

                // Only compare earlier rounds (can't respond to future)
                if (earlier.round > current.round) continue;

                comparisons++;
                const edge = detectEdge(current, earlier);
                if (edge) {
                    this._addEdge({
                        id: `edge-${earlier.id}-${current.id}`,
                        sourceId: current.id,
                        targetId: edge.targetId,
                        type: edge.type,
                        confidence: edge.confidence,
                        round: current.round,
                        agentId: current.agentId,
                        method: edge.method,
                    });
                }
            }
        }

        this._built = true;
    }

    clear(): void {
        this._nodes.clear();
        this._allEdges = [];
        this._outEdges.clear();
        this._inEdges.clear();
        this._nodeOrder = [];
        this._built = false;
    }

    getNode(id: string): ArgumentNode | undefined {
        return this._nodes.get(id);
    }

    getAllNodes(): readonly ArgumentNode[] {
        return Array.from(this._nodes.values());
    }

    getAgentNodes(agentId: string): readonly ArgumentNode[] {
        return Array.from(this._nodes.values()).filter((n) => n.agentId === agentId);
    }

    getRoundNodes(round: number): readonly ArgumentNode[] {
        return Array.from(this._nodes.values()).filter((n) => n.round === round);
    }

    getAllEdges(): readonly ArgumentEdge[] {
        return this._allEdges;
    }

    getOutgoingEdges(nodeId: string): readonly ArgumentEdge[] {
        return this._outEdges.get(nodeId) ?? [];
    }

    getIncomingEdges(nodeId: string): readonly ArgumentEdge[] {
        return this._inEdges.get(nodeId) ?? [];
    }

    getStats(): ArgumentGraphStats {
        const nodeCount = this._nodes.size;
        const edgeCount = this._allEdges.length;

        const supports = this._allEdges.filter((e) => e.type === 'supports').length;
        const attacks = this._allEdges.filter((e) => e.type === 'attacks').length;

        const visited = new Set<string>();
        let components = 0;
        for (const id of this._nodeOrder) {
            if (!visited.has(id)) {
                components++;
                this._bfs(id, visited);
            }
        }

        const withEdges = new Set<string>();
        for (const e of this._allEdges) {
            withEdges.add(e.sourceId);
            withEdges.add(e.targetId);
        }
        const orphans = nodeCount - withEdges.size;

        const allConfidences = Array.from(this._nodes.values()).map((n) => n.confidence);
        const avgConf =
            allConfidences.length > 0
                ? allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length
                : 0;

        return {
            totalNodes: nodeCount,
            totalEdges: edgeCount,
            connectedComponents: components,
            longestPath: this._computeLongestPath(),
            supportRatio: attacks > 0 ? supports / attacks : supports > 0 ? Infinity : 0,
            attackRatio: supports > 0 ? attacks / supports : attacks > 0 ? Infinity : 0,
            orphanNodes: orphans,
            averageConfidence: avgConf,
        };
    }

    getCentrality(nodeId: string): number {
        const nodeCount = this._nodes.size;
        if (nodeCount <= 1) return 1;

        const outDegree = this._outEdges.get(nodeId)?.length ?? 0;
        const inDegree = this._inEdges.get(nodeId)?.length ?? 0;
        const degree = outDegree + inDegree;

        return degree / (nodeCount - 1);
    }

    getLongestChain(): readonly ArgumentNode[] {
        // DP on nodes sorted by round
        const sorted = Array.from(this._nodes.values()).sort((a, b) => a.round - b.round);
        const dist = new Map<string, number>();
        const prev = new Map<string, string | null>();

        for (const node of sorted) {
            dist.set(node.id, 1);
            prev.set(node.id, null);

            const incoming = this._inEdges.get(node.id) ?? [];
            for (const edge of incoming) {
                const sourceDist = dist.get(edge.sourceId) ?? 0;
                if (sourceDist + 1 > (dist.get(node.id) ?? 0)) {
                    dist.set(node.id, sourceDist + 1);
                    prev.set(node.id, edge.sourceId);
                }
            }
        }

        // Find the node with max distance
        let maxDist = 0;
        let maxNode: string | null = null;
        for (const [id, d] of dist) {
            if (d > maxDist) {
                maxDist = d;
                maxNode = id;
            }
        }

        // Reconstruct path
        const path: ArgumentNode[] = [];
        let current = maxNode;
        while (current) {
            const node = this._nodes.get(current);
            if (node) path.unshift(node);
            current = prev.get(current) ?? null;
        }

        return path;
    }

    getUnattackedClaims(
        currentRound: number,
        minRoundsUnchallenged = 3,
    ): readonly UnattackedClaim[] {
        const result: UnattackedClaim[] = [];

        for (const [id, node] of this._nodes) {
            const incoming = this._inEdges.get(id) ?? [];
            const attacks = incoming.filter((e) => e.type === 'attacks');

            if (attacks.length > 0) {
                const lastAttackRound = Math.max(...attacks.map((e) => e.round));
                const roundsSince = currentRound - lastAttackRound;
                if (roundsSince >= minRoundsUnchallenged) {
                    result.push({ node, roundsSince, lastRoundChallenged: lastAttackRound });
                }
            } else if (currentRound - node.round >= minRoundsUnchallenged) {
                result.push({
                    node,
                    roundsSince: currentRound - node.round,
                    lastRoundChallenged: node.round,
                });
            }
        }

        return result.sort((a, b) => b.roundsSince - a.roundsSince);
    }

    findBestConstraint(agentId: string, currentRound: number): ConstraintCandidate | null {
        let best: ConstraintCandidate | null = null;
        let bestScore = -1;

        for (const [id, node] of this._nodes) {
            if (node.agentId === agentId) continue;
            if (node.round >= currentRound) continue;

            // Check if this agent already attacked this node
            const outgoing = this._outEdges.get(id) ?? [];
            const alreadyAttacked = outgoing.some(
                (e) => e.agentId === agentId && (e.type === 'attacks' || e.type === 'responds_to'),
            );
            if (alreadyAttacked) continue;

            // Prefer claims that were recently made by opponents
            const recencyBonus = Math.max(0, 1 - (currentRound - node.round) * 0.2);
            const attackCount =
                this._inEdges.get(id)?.filter((e) => e.type === 'attacks').length ?? 0;
            const centrality = this.getCentrality(id);

            // Target high-centrality claims that haven't been over-attacked
            const score = centrality * 0.4 + recencyBonus * 0.4 - attackCount * 0.05;

            if (score > bestScore) {
                const edgeType: ArgumentEdgeType = hasAdversarialLanguage(node.content)
                    ? 'supports'
                    : 'attacks';
                best = { node, type: edgeType, score };
                bestScore = score;
            }
        }

        return best;
    }

    getAttacksOnAgent(targetAgentId: string): readonly ArgumentEdge[] {
        return this._allEdges.filter(
            (e) => e.type === 'attacks' && this._nodes.get(e.targetId)?.agentId === targetAgentId,
        );
    }

    getSupportsFromAgent(agentId: string): readonly ArgumentEdge[] {
        return this._allEdges.filter((e) => e.type === 'supports' && e.agentId === agentId);
    }

    getEdgeBalance(nodeId: string): { support: number; attack: number; ratio: number } {
        const incoming = this._inEdges.get(nodeId) ?? [];
        const support = incoming.filter(
            (e) => e.type === 'supports' || e.type === 'evidence_for',
        ).length;
        const attack = incoming.filter(
            (e) => e.type === 'attacks' || e.type === 'evidence_against',
        ).length;
        return {
            support,
            attack,
            ratio: attack > 0 ? support / attack : support > 0 ? Infinity : 0,
        };
    }

    getSubgraph(nodeId: string, maxDepth = 3): { nodes: ArgumentNode[]; edges: ArgumentEdge[] } {
        const visited = new Set<string>();
        const nodes: ArgumentNode[] = [];
        const edges: ArgumentEdge[] = [];
        const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;
            if (visited.has(id) || depth > maxDepth) continue;
            visited.add(id);

            const node = this._nodes.get(id);
            if (node) nodes.push(node);

            const outgoing = this._outEdges.get(id) ?? [];
            for (const edge of outgoing) {
                edges.push(edge);
                queue.push({ id: edge.targetId, depth: depth + 1 });
            }

            const incoming = this._inEdges.get(id) ?? [];
            for (const edge of incoming) {
                edges.push(edge);
                queue.push({ id: edge.sourceId, depth: depth + 1 });
            }
        }

        return { nodes, edges };
    }

    // ── Private ──

    private _addEdge(edge: ArgumentEdge): void {
        this._allEdges.push(edge);

        const out = this._outEdges.get(edge.sourceId) ?? [];
        out.push(edge);
        this._outEdges.set(edge.sourceId, out);

        const inc = this._inEdges.get(edge.targetId) ?? [];
        inc.push(edge);
        this._inEdges.set(edge.targetId, inc);
    }

    private _bfs(start: string, visited: Set<string>): void {
        const queue = [start];
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);

            const outgoing = this._outEdges.get(id) ?? [];
            for (const e of outgoing) {
                if (!visited.has(e.targetId)) queue.push(e.targetId);
            }
            const incoming = this._inEdges.get(id) ?? [];
            for (const e of incoming) {
                if (!visited.has(e.sourceId)) queue.push(e.sourceId);
            }
        }
    }

    private _computeLongestPath(): number {
        const sorted = Array.from(this._nodes.values()).sort((a, b) => a.round - b.round);
        const dist = new Map<string, number>();

        for (const node of sorted) {
            const incoming = this._inEdges.get(node.id) ?? [];
            let best = 1;
            for (const edge of incoming) {
                const d = (dist.get(edge.sourceId) ?? 0) + 1;
                if (d > best) best = d;
            }
            dist.set(node.id, best);
        }

        return Math.max(0, ...dist.values());
    }
}
