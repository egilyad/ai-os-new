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

interface SessionGraphState {
    nodes: Map<string, ArgumentNode>;
    allEdges: ArgumentEdge[];
    outEdges: Map<string, ArgumentEdge[]>;
    inEdges: Map<string, ArgumentEdge[]>;
    nodeOrder: string[];
    built: boolean;
}

export class ArgumentGraphService implements IArgumentGraphService {
    private _sessions = new Map<string, SessionGraphState>();

    private _session(sessionId: string): SessionGraphState | undefined {
        return this._sessions.get(sessionId);
    }

    private _state(sessionId: string): SessionGraphState {
        let s = this._sessions.get(sessionId);
        if (!s) {
            s = {
                nodes: new Map(),
                allEdges: [],
                outEdges: new Map(),
                inEdges: new Map(),
                nodeOrder: [],
                built: false,
            };
            this._sessions.set(sessionId, s);
        }
        return s;
    }

    isInitialized(sessionId: string): boolean {
        return this._session(sessionId)?.built ?? false;
    }

    build(sessionId: string, args: ReadonlyArray<GraphBuildInput>): void {
        const state = this._state(sessionId);
        state.nodes.clear();
        state.allEdges = [];
        state.outEdges.clear();
        state.inEdges.clear();
        state.nodeOrder = [];
        state.built = false;

        if (args.length === 0) return;

        // Build nodes
        for (const a of args) {
            state.nodes.set(a.id, {
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
            state.nodeOrder.push(a.id);
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
                    this._addEdge(state, {
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

        state.built = true;
    }

    clear(sessionId: string): void {
        this._sessions.delete(sessionId);
    }

    getNode(sessionId: string, id: string): ArgumentNode | undefined {
        return this._session(sessionId)?.nodes.get(id);
    }

    getAllNodes(sessionId: string): readonly ArgumentNode[] {
        return Array.from(this._session(sessionId)?.nodes.values() ?? []);
    }

    getAgentNodes(sessionId: string, agentId: string): readonly ArgumentNode[] {
        return Array.from(this._session(sessionId)?.nodes.values() ?? []).filter(
            (n) => n.agentId === agentId,
        );
    }

    getRoundNodes(sessionId: string, round: number): readonly ArgumentNode[] {
        return Array.from(this._session(sessionId)?.nodes.values() ?? []).filter(
            (n) => n.round === round,
        );
    }

    getAllEdges(sessionId: string): readonly ArgumentEdge[] {
        return this._session(sessionId)?.allEdges ?? [];
    }

    getOutgoingEdges(sessionId: string, nodeId: string): readonly ArgumentEdge[] {
        return this._session(sessionId)?.outEdges.get(nodeId) ?? [];
    }

    getIncomingEdges(sessionId: string, nodeId: string): readonly ArgumentEdge[] {
        return this._session(sessionId)?.inEdges.get(nodeId) ?? [];
    }

    getStats(sessionId: string): ArgumentGraphStats {
        const state = this._state(sessionId);
        const nodeCount = state.nodes.size;
        const edgeCount = state.allEdges.length;

        const supports = state.allEdges.filter((e) => e.type === 'supports').length;
        const attacks = state.allEdges.filter((e) => e.type === 'attacks').length;

        const visited = new Set<string>();
        let components = 0;
        for (const id of state.nodeOrder) {
            if (!visited.has(id)) {
                components++;
                this._bfs(state, id, visited);
            }
        }

        const withEdges = new Set<string>();
        for (const e of state.allEdges) {
            withEdges.add(e.sourceId);
            withEdges.add(e.targetId);
        }
        const orphans = nodeCount - withEdges.size;

        const allConfidences = Array.from(state.nodes.values()).map((n) => n.confidence);
        const avgConf =
            allConfidences.length > 0
                ? allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length
                : 0;

        return {
            totalNodes: nodeCount,
            totalEdges: edgeCount,
            connectedComponents: components,
            longestPath: this._computeLongestPath(state),
            supportRatio: attacks > 0 ? supports / attacks : supports > 0 ? Infinity : 0,
            attackRatio: supports > 0 ? attacks / supports : attacks > 0 ? Infinity : 0,
            orphanNodes: orphans,
            averageConfidence: avgConf,
        };
    }

    getCentrality(sessionId: string, nodeId: string): number {
        const state = this._session(sessionId);
        const nodeCount = state?.nodes.size ?? 0;
        if (nodeCount <= 1) return 1;

        const outDegree = state?.outEdges.get(nodeId)?.length ?? 0;
        const inDegree = state?.inEdges.get(nodeId)?.length ?? 0;
        const degree = outDegree + inDegree;

        return degree / (nodeCount - 1);
    }

    getLongestChain(sessionId: string): readonly ArgumentNode[] {
        const state = this._session(sessionId);
        if (!state) return [];

        // DP on nodes sorted by round
        const sorted = Array.from(state.nodes.values()).sort((a, b) => a.round - b.round);
        const dist = new Map<string, number>();
        const prev = new Map<string, string | null>();

        for (const node of sorted) {
            dist.set(node.id, 1);
            prev.set(node.id, null);

            const incoming = state.inEdges.get(node.id) ?? [];
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
            const node = state.nodes.get(current);
            if (node) path.unshift(node);
            current = prev.get(current) ?? null;
        }

        return path;
    }

    getUnattackedClaims(
        sessionId: string,
        currentRound: number,
        minRoundsUnchallenged = 3,
    ): readonly UnattackedClaim[] {
        const state = this._session(sessionId);
        if (!state) return [];

        const result: UnattackedClaim[] = [];

        for (const [id, node] of state.nodes) {
            const incoming = state.inEdges.get(id) ?? [];
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

    findBestConstraint(
        sessionId: string,
        agentId: string,
        currentRound: number,
    ): ConstraintCandidate | null {
        const state = this._session(sessionId);
        if (!state) return null;

        let best: ConstraintCandidate | null = null;
        let bestScore = -1;

        for (const [id, node] of state.nodes) {
            if (node.agentId === agentId) continue;
            if (node.round >= currentRound) continue;

            // Check if this agent already attacked this node
            const outgoing = state.outEdges.get(id) ?? [];
            const alreadyAttacked = outgoing.some(
                (e) => e.agentId === agentId && (e.type === 'attacks' || e.type === 'responds_to'),
            );
            if (alreadyAttacked) continue;

            // Prefer claims that were recently made by opponents
            const recencyBonus = Math.max(0, 1 - (currentRound - node.round) * 0.2);
            const attackCount =
                state.inEdges.get(id)?.filter((e) => e.type === 'attacks').length ?? 0;
            const centrality = this.getCentrality(sessionId, id);

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

    getAttacksOnAgent(sessionId: string, targetAgentId: string): readonly ArgumentEdge[] {
        const state = this._session(sessionId);
        if (!state) return [];
        return state.allEdges.filter(
            (e) => e.type === 'attacks' && state.nodes.get(e.targetId)?.agentId === targetAgentId,
        );
    }

    getSupportsFromAgent(sessionId: string, agentId: string): readonly ArgumentEdge[] {
        const state = this._session(sessionId);
        if (!state) return [];
        return state.allEdges.filter((e) => e.type === 'supports' && e.agentId === agentId);
    }

    getEdgeBalance(
        sessionId: string,
        nodeId: string,
    ): { support: number; attack: number; ratio: number } {
        const incoming = this._session(sessionId)?.inEdges.get(nodeId) ?? [];
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

    getSubgraph(
        sessionId: string,
        nodeId: string,
        maxDepth = 3,
    ): { nodes: ArgumentNode[]; edges: ArgumentEdge[] } {
        const state = this._session(sessionId);
        if (!state) return { nodes: [], edges: [] };

        const visited = new Set<string>();
        const nodes: ArgumentNode[] = [];
        const edges: ArgumentEdge[] = [];
        const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;
            if (visited.has(id) || depth > maxDepth) continue;
            visited.add(id);

            const node = state.nodes.get(id);
            if (node) nodes.push(node);

            const outgoing = state.outEdges.get(id) ?? [];
            for (const edge of outgoing) {
                edges.push(edge);
                queue.push({ id: edge.targetId, depth: depth + 1 });
            }

            const incoming = state.inEdges.get(id) ?? [];
            for (const edge of incoming) {
                edges.push(edge);
                queue.push({ id: edge.sourceId, depth: depth + 1 });
            }
        }

        return { nodes, edges };
    }

    // ── Private ──

    private _addEdge(state: SessionGraphState, edge: ArgumentEdge): void {
        state.allEdges.push(edge);

        const out = state.outEdges.get(edge.sourceId) ?? [];
        out.push(edge);
        state.outEdges.set(edge.sourceId, out);

        const inc = state.inEdges.get(edge.targetId) ?? [];
        inc.push(edge);
        state.inEdges.set(edge.targetId, inc);
    }

    private _bfs(state: SessionGraphState, start: string, visited: Set<string>): void {
        const queue = [start];
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);

            const outgoing = state.outEdges.get(id) ?? [];
            for (const e of outgoing) {
                if (!visited.has(e.targetId)) queue.push(e.targetId);
            }
            const incoming = state.inEdges.get(id) ?? [];
            for (const e of incoming) {
                if (!visited.has(e.sourceId)) queue.push(e.sourceId);
            }
        }
    }

    private _computeLongestPath(state: SessionGraphState): number {
        const sorted = Array.from(state.nodes.values()).sort((a, b) => a.round - b.round);
        const dist = new Map<string, number>();

        for (const node of sorted) {
            const incoming = state.inEdges.get(node.id) ?? [];
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
