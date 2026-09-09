/**
 * HierarchyService — Wave 5.1 (CEO → subordinates + budgets, local-first).
 *
 * Tree of command with per-node budget caps and spend ledger. Every mutation
 * appends to the Audit log (hard audit). Overspend is refused.
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService, IHierarchyService } from '../../contracts/ops';
import type { HierarchyNode } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Hierarchy');

function now(): number {
    return Date.now();
}

export class HierarchyService implements IHierarchyService {
    constructor(
        private repo: OpsRepository,
        private events: IEventBus,
        private audit: IAuditService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createNode(input: {
        name: string;
        parentId?: string | null;
        agentId?: string;
        budgetCap?: number;
    }): Promise<HierarchyNode> {
        if (input.parentId) {
            const parent = await this.repo.getNode(input.parentId);
            if (!parent) throw new Error(`Parent node not found: ${input.parentId}`);
        }
        const t = now();
        const node: HierarchyNode = {
            id: genId('hnode'),
            name: input.name,
            parentId: input.parentId ?? null,
            agentId: input.agentId,
            budgetCap: input.budgetCap,
            spent: 0,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putNode(node);
        await this.audit.append('hierarchy', 'node.created', node.id, node.name);
        this.events.emit(EVENTS.OPS_HIERARCHY, { nodeId: node.id, action: 'created' });
        return node;
    }

    async getNode(id: string): Promise<HierarchyNode | null> {
        return this.repo.getNode(id);
    }

    async tree(): Promise<HierarchyNode[]> {
        return this.repo.listNodes();
    }

    async subordinates(id: string): Promise<HierarchyNode[]> {
        const all = await this.repo.listNodes();
        const out: HierarchyNode[] = [];
        const queue = [id];
        const byParent = new Map<string, HierarchyNode[]>();
        for (const n of all) {
            if (!n.parentId) continue;
            const list = byParent.get(n.parentId) ?? [];
            list.push(n);
            byParent.set(n.parentId, list);
        }
        while (queue.length > 0) {
            const cur = queue.shift() as string;
            for (const child of byParent.get(cur) ?? []) {
                out.push(child);
                queue.push(child.id);
            }
        }
        return out;
    }

    async setBudget(id: string, cap: number): Promise<HierarchyNode> {
        const node = await this.require(id);
        if (cap < 0) throw new Error('Budget cap must be >= 0');
        if (cap < node.spent) throw new Error(`Cap ${cap} below already spent ${node.spent}`);
        node.budgetCap = cap;
        node.updatedAt = now();
        await this.repo.putNode(node);
        await this.audit.append('hierarchy', 'budget.set', id, `cap=${cap}`);
        return node;
    }

    async recordSpend(id: string, amount: number, reason = ''): Promise<HierarchyNode> {
        const node = await this.require(id);
        if (amount < 0) throw new Error('Spend amount must be >= 0');
        if (node.budgetCap !== undefined && node.spent + amount > node.budgetCap) {
            await this.audit.append('hierarchy', 'spend.denied', id, `amount=${amount} cap=${node.budgetCap}`);
            throw new Error(`Budget exceeded for ${node.name}: cap ${node.budgetCap}, spent ${node.spent}`);
        }
        node.spent += amount;
        node.updatedAt = now();
        await this.repo.putNode(node);
        await this.audit.append('hierarchy', 'spend.recorded', id, `amount=${amount} ${reason}`.slice(0, 500));
        this.events.emit(EVENTS.OPS_BUDGET, { nodeId: id, spent: node.spent });
        return node;
    }

    async removeNode(id: string): Promise<void> {
        const subs = await this.subordinates(id);
        if (subs.length > 0) throw new Error(`Node has ${subs.length} subordinate(s) — reassign first`);
        await this.repo.deleteNode(id);
        await this.audit.append('hierarchy', 'node.removed', id, '');
        this.events.emit(EVENTS.OPS_HIERARCHY, { nodeId: id, action: 'removed' });
    }

    private async require(id: string): Promise<HierarchyNode> {
        const n = await this.repo.getNode(id);
        if (!n) throw new Error(`Hierarchy node not found: ${id}`);
        return n;
    }
}
