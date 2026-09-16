/**
 * StrategyService — Wave 8.14/8.16 (experience replay + recursive decomposition).
 *
 * Accumulates per-task-class strategies with running success rates; `replay()`
 * returns the best-known steps. `decompose()` builds a goal tree with bounded
 * depth/breadth (deterministic keyword splitter, LLM port optional later);
 * `markNode()` tracks bottom-up completion.
 */
import type { MetaRepository } from '../../dal/meta-repository';
import type { IStrategyService } from '../../contracts/meta';
import type { Decomposition, DecompositionNode, StrategyRecord } from '../../types/meta-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Strategy');

function now(): number {
    return Date.now();
}

function splitGoal(goal: string, breadth: number): string[] {
    const parts = goal
        .split(/[,;]|\s+и\s+|\s+and\s+/iu)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    if (parts.length >= 2) return parts.slice(0, breadth);
    // Fallback: generic phase split so every goal decomposes into something useful.
    const base = goal.length > 80 ? goal.slice(0, 80) : goal;
    return [`Research: ${base}`, `Execute: ${base}`, `Verify: ${base}`].slice(0, breadth);
}

function buildTree(goal: string, depth: number, breadth: number): DecompositionNode {
    const node: DecompositionNode = {
        id: genId('dnode'),
        goal,
        children: [],
        status: 'pending',
    };
    if (depth <= 0) return node;
    for (const sub of splitGoal(goal, breadth)) {
        if (sub === goal) continue;
        node.children.push(buildTree(sub, depth - 1, breadth));
    }
    return node;
}

function findNode(root: DecompositionNode, id: string): DecompositionNode | null {
    if (root.id === id) return root;
    for (const c of root.children) {
        const found = findNode(c, id);
        if (found) return found;
    }
    return null;
}

export class StrategyService implements IStrategyService {
    constructor(private repo: MetaRepository) {}

    async init(): Promise<void> {
        LOGGER.info('Strategy', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async recordStrategy(taskClass: string, steps: string[], success: boolean): Promise<StrategyRecord> {
        const all = await this.repo.listStrategies();
        const existing = all.find(
            (s) => s.taskClass === taskClass && JSON.stringify(s.steps) === JSON.stringify(steps),
        );
        const t = now();
        if (existing) {
            existing.uses += 1;
            existing.successRate =
                (existing.successRate * (existing.uses - 1) + (success ? 1 : 0)) / existing.uses;
            existing.updatedAt = t;
            await this.repo.putStrategy(existing);
            return existing;
        }
        const record: StrategyRecord = {
            id: genId('strat'),
            taskClass,
            steps: [...steps],
            successRate: success ? 1 : 0,
            uses: 1,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putStrategy(record);
        return record;
    }

    async bestFor(taskClass: string): Promise<StrategyRecord | null> {
        const all = (await this.repo.listStrategies()).filter((s) => s.taskClass === taskClass);
        if (all.length === 0) return null;
        all.sort((a, b) => b.successRate - a.successRate || b.uses - a.uses);
        return all[0] ?? null;
    }

    async replay(taskClass: string): Promise<string[]> {
        const best = await this.bestFor(taskClass);
        return best ? [...best.steps] : [];
    }

    async decompose(goal: string, depth = 2, breadth = 3): Promise<Decomposition> {
        const t = now();
        const tree = buildTree(
            goal,
            Math.max(0, Math.min(4, depth)),
            Math.max(2, Math.min(5, breadth)),
        );
        const decomposition: Decomposition = {
            id: genId('decomp'),
            rootGoal: goal,
            tree,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putDecomposition(decomposition);
        return decomposition;
    }

    async markNode(decompositionId: string, nodeId: string, status: 'done' | 'failed'): Promise<Decomposition> {
        const d = await this.repo.getDecomposition(decompositionId);
        if (!d) throw new Error(`Decomposition not found: ${decompositionId}`);
        const node = findNode(d.tree, nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);
        node.status = status;
        d.updatedAt = now();
        await this.repo.putDecomposition(d);
        return d;
    }
}
