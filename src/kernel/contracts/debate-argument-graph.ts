// ── Unified Argument Graph (Phase A) ───────────────────────────────────
// Single canonical graph model for argument structure, supporting all
// P0-P2 debate quality techniques. Replaces ad-hoc graph building in
// EntanglementEngine, AnchoringService, CitationGraph, MemoryExtractor.

export type ArgumentEdgeType =
    | 'attacks'
    | 'supports'
    | 'refines'
    | 'questions'
    | 'evidence_for'
    | 'evidence_against'
    | 'duplicates'
    | 'responds_to';

export type EdgeDetectionMethod =
    'explicit_parent' | 'jaccard_attack' | 'jaccard_support' | 'jaccard_duplicate' | 'same_topic';

export interface ArgumentNode {
    readonly id: string;
    readonly agentId: string;
    readonly agentName: string;
    readonly content: string;
    readonly round: number;
    readonly timestamp: number;
    readonly confidence: number;
    readonly position?: string;
    readonly sourceArgumentId?: string;
}

export interface ArgumentEdge {
    readonly id: string;
    readonly sourceId: string;
    readonly targetId: string;
    readonly type: ArgumentEdgeType;
    readonly confidence: number;
    readonly round: number;
    readonly agentId: string;
    readonly method: EdgeDetectionMethod;
}

export interface ArgumentGraphStats {
    readonly totalNodes: number;
    readonly totalEdges: number;
    readonly connectedComponents: number;
    readonly longestPath: number;
    readonly supportRatio: number;
    readonly attackRatio: number;
    readonly orphanNodes: number;
    readonly averageConfidence: number;
}

export interface UnattackedClaim {
    readonly node: ArgumentNode;
    readonly roundsSince: number;
    readonly lastRoundChallenged: number;
}

export interface ConstraintCandidate {
    readonly node: ArgumentNode;
    readonly type: ArgumentEdgeType;
    readonly score: number;
}

export interface GraphBuildInput {
    readonly id: string;
    readonly agentId: string;
    readonly agentName: string;
    readonly content: string;
    readonly round: number;
    readonly timestamp: number;
    readonly confidence: number;
    readonly position?: string;
    readonly parentId?: string;
    readonly parentResolution?: string;
    readonly duplicateOf?: string;
}

export interface IArgumentGraphService {
    /** Build (or rebuild) the graph from debate arguments. Idempotent. */
    build(args: ReadonlyArray<GraphBuildInput>): void;

    /** Clear all nodes and edges. */
    clear(): void;

    /** Returns true if graph has been built and has nodes. */
    readonly initialized: boolean;

    // ── Node access ──

    getNode(id: string): ArgumentNode | undefined;
    getAllNodes(): readonly ArgumentNode[];
    getAgentNodes(agentId: string): readonly ArgumentNode[];
    getRoundNodes(round: number): readonly ArgumentNode[];

    // ── Edge access ──

    getAllEdges(): readonly ArgumentEdge[];
    getOutgoingEdges(nodeId: string): readonly ArgumentEdge[];
    getIncomingEdges(nodeId: string): readonly ArgumentEdge[];

    // ── Graph analysis ──

    getStats(): ArgumentGraphStats;

    /** Compute PageRank-like centrality for a node. */
    getCentrality(nodeId: string): number;

    /** Longest directed path through the graph. */
    getLongestChain(): readonly ArgumentNode[];

    /**
     * Find claims that have not been attacked for N rounds.
     * Used by AnchoringService (P0.5) and Delta-Focusing.
     */
    getUnattackedClaims(
        currentRound: number,
        minRoundsUnchallenged?: number,
    ): readonly UnattackedClaim[];

    /** Find the best candidate for entanglement constraint. */
    findBestConstraint(agentId: string, currentRound: number): ConstraintCandidate | null;

    /** Find all attack edges for a given agent. */
    getAttacksOnAgent(targetAgentId: string): readonly ArgumentEdge[];

    /** Find all support edges from a given agent. */
    getSupportsFromAgent(agentId: string): readonly ArgumentEdge[];

    /** Compute the ratio of support vs attack edges for a claim node. */
    getEdgeBalance(nodeId: string): { support: number; attack: number; ratio: number };

    /** Return subgraph reachable from a node via outgoing edges. */
    getSubgraph(
        nodeId: string,
        maxDepth?: number,
    ): { nodes: ArgumentNode[]; edges: ArgumentEdge[] };
}
