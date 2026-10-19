/**
 * Personalized PageRank (PPR) — HippoRAG-style associative recall.
 *
 * Given seed node(s), rank every node in an undirected relation graph by how
 * much probability mass a random walk that restarts at the seeds spends on it.
 * Pure and deterministic; callers provide already time-filtered edges.
 */

export interface PprEdge {
    fromId: string;
    toId: string;
}

export interface PprOptions {
    /** Restart/teleport probability mass kept at the seeds (default 0.85). */
    alpha?: number;
    /** Max power iterations (default 50). */
    maxIter?: number;
    /** L1 convergence tolerance (default 1e-6). */
    tol?: number;
}

/**
 * Compute the PPR stationary distribution over the undirected graph.
 * Returns a map for every node present in `seeds` or `edges`. Sums to ~1 when
 * at least one seed is present; returns an empty map otherwise.
 */
export function personalizedPageRank(
    seeds: string[],
    edges: PprEdge[],
    opts: PprOptions = {},
): Map<string, number> {
    const alpha = opts.alpha ?? 0.85;
    const maxIter = opts.maxIter ?? 50;
    const tol = opts.tol ?? 1e-6;

    const ids: string[] = [];
    const present = new Set<string>();
    const add = (id: string): void => {
        if (!present.has(id)) {
            present.add(id);
            ids.push(id);
        }
    };
    for (const s of seeds) add(s);
    for (const e of edges) {
        add(e.fromId);
        add(e.toId);
    }

    const seedSet = new Set(seeds.filter((s) => present.has(s)));
    if (seedSet.size === 0) return new Map();

    const adj = new Map<string, Set<string>>();
    for (const id of ids) adj.set(id, new Set());
    for (const e of edges) {
        adj.get(e.fromId)!.add(e.toId);
        adj.get(e.toId)!.add(e.fromId);
    }

    const seedMass = 1 / seedSet.size;
    let p = new Map<string, number>();
    for (const id of ids) p.set(id, seedSet.has(id) ? seedMass : 0);

    for (let iter = 0; iter < maxIter; iter++) {
        const next = new Map<string, number>();
        for (const id of ids) next.set(id, 0);
        let danglingMass = 0;

        for (const id of ids) {
            const mass = p.get(id)!;
            if (mass === 0) continue;
            const neigh = adj.get(id)!;
            if (neigh.size === 0) {
                danglingMass += mass;
                continue;
            }
            const share = mass / neigh.size;
            for (const nb of neigh) next.set(nb, next.get(nb)! + share);
        }

        // Teleport (1 - alpha) plus dangling mass back to the seeds.
        const teleport = (1 - alpha) + alpha * danglingMass;
        let delta = 0;
        const updated = new Map<string, number>();
        for (const id of ids) {
            const value = alpha * next.get(id)! + (seedSet.has(id) ? teleport * seedMass : 0);
            delta += Math.abs(value - p.get(id)!);
            updated.set(id, value);
        }
        p = updated;
        if (delta < tol) break;
    }

    return p;
}
