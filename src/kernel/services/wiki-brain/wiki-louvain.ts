/**
 * Greedy modularity maximisation (single-pass Louvain phase 1).
 *
 * Operates on an undirected weighted graph given as a sparse adjacency list.
 * Each node starts in its own community; nodes are repeatedly moved to the
 * neighbouring community that maximises the modularity gain until a stable
 * partition is reached. This is the core of Louvain without the multi-level
 * aggregation pass — sufficient for wiki-scale graphs and dependency-free.
 */

export interface LouvainGraph {
    /** adj[i] maps neighbour node index -> edge weight. */
    adj: Map<number, number>[];
    /** number of nodes. */
    size: number;
    /** total edge weight (undirected, counted once). */
    totalWeight: number;
}

export function buildLouvainGraph(
    edges: Array<[number, number, number]>,
    size: number,
): LouvainGraph {
    const adj: Map<number, number>[] = Array.from({ length: size }, () => new Map());
    let totalWeight = 0;
    for (const [a, b, w] of edges) {
        if (a === b) continue;
        adj[a]!.set(b, (adj[a]!.get(b) ?? 0) + w);
        adj[b]!.set(a, (adj[b]!.get(a) ?? 0) + w);
        totalWeight += w;
    }
    return { adj, size, totalWeight };
}

/**
 * Returns a flat community label for every node (0..k-1).
 * Nodes with no edges (totalWeight is 0) each stay in their own community.
 */
export function louvainCommunities(graph: LouvainGraph): number[] {
    const { adj, size, totalWeight } = graph;
    if (totalWeight <= 0) return Array.from({ length: size }, (_, i) => i);

    const degree: number[] = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
        for (const w of adj[i]!.values()) degree[i] = (degree[i] ?? 0) + w;
    }

    const community = Array.from({ length: size }, (_, i) => i);
    const tot = new Map<number, number>();
    for (let i = 0; i < size; i++) tot.set(i, degree[i]!);

    const twoM2 = 2 * totalWeight * totalWeight;
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 0; i < size; i++) {
            const current = community[i]!;
            tot.set(current, (tot.get(current) ?? 0) - degree[i]!);

            let best = current;
            let bestGain = 0;
            const candidates = new Map<number, number>();
            for (const [v, w] of adj[i]!) {
                const cv = community[v]!;
                candidates.set(cv, (candidates.get(cv) ?? 0) + w);
            }
            for (const [c, kiin] of candidates) {
                const totC = tot.get(c) ?? 0;
                const gain = kiin / totalWeight - (totC * degree[i]!) / twoM2;
                if (gain > bestGain) {
                    bestGain = gain;
                    best = c;
                }
            }

            if (best !== current) {
                community[i] = best;
                tot.set(best, (tot.get(best) ?? 0) + degree[i]!);
                improved = true;
            } else {
                tot.set(current, (tot.get(current) ?? 0) + degree[i]!);
            }
        }
    }

    // Remap to contiguous community ids.
    const remap = new Map<number, number>();
    for (const c of community) {
        if (!remap.has(c)) remap.set(c, remap.size);
    }
    return community.map((c) => remap.get(c)!);
}

/** For a partition, compute internal/external edge weight per community. */
export function communityEdgeBalance(
    graph: LouvainGraph,
    community: number[],
): Map<number, { internal: number; external: number }> {
    const balance = new Map<number, { internal: number; external: number }>();
    const getBucket = (c: number) => {
        let b = balance.get(c);
        if (!b) {
            b = { internal: 0, external: 0 };
            balance.set(c, b);
        }
        return b;
    };
    for (let i = 0; i < graph.size; i++) {
        for (const [j, w] of graph.adj[i]!) {
            if (j < i) continue; // undirected — count once
            const ci = community[i]!;
            const cj = community[j]!;
            if (ci === cj) {
                getBucket(ci).internal += w;
            } else {
                getBucket(ci).external += w;
                getBucket(cj).external += w;
            }
        }
    }
    return balance;
}
