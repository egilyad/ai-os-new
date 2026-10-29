export interface DagNode<T> {
    id: string;
    payload: T;
    dependsOn: string[];
}

export interface DagLevel<T> {
    nodes: DagNode<T>[];
}

/**
 * P3-1: minimal DAG planner primitives for decomposing a question into
 * sub-questions with dependencies. `buildDagLevels` returns the nodes grouped
 * into parallel levels (all nodes in a level are independent and can run in
 * parallel), and throws on missing dependencies or cycles.
 */
export function buildDagLevels<T>(nodes: DagNode<T>[]): DagLevel<T>[] {
    const byId = new Map<string, DagNode<T>>();
    for (const n of nodes) byId.set(n.id, n);

    const indegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();
    for (const n of nodes) {
        indegree.set(n.id, 0);
        dependents.set(n.id, []);
    }

    for (const n of nodes) {
        for (const dep of n.dependsOn) {
            if (!byId.has(dep)) throw new Error(`DAG missing dependency: ${dep}`);
            indegree.set(n.id, (indegree.get(n.id) ?? 0) + 1);
            dependents.get(dep)?.push(n.id);
        }
    }

    const levels: DagNode<T>[][] = [];
    let frontier = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0);
    while (frontier.length > 0) {
        levels.push(frontier);
        const next: DagNode<T>[] = [];
        for (const n of frontier) {
            for (const dependent of dependents.get(n.id) ?? []) {
                const deg = (indegree.get(dependent) ?? 1) - 1;
                indegree.set(dependent, deg);
                if (deg === 0) next.push(byId.get(dependent) as DagNode<T>);
            }
        }
        frontier = next;
    }

    const processed = levels.reduce((sum, l) => sum + l.length, 0);
    if (processed !== nodes.length) throw new Error('DAG contains a cycle');

    return levels.map((level) => ({ nodes: level }));
}
