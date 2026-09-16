import type { IEventBus } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import type {
    AgentRef,
    ExecutionMode,
    ExecutionTarget,
    Invocation,
    InvocationContext,
    InvocationPolicy,
    InvocationRequest,
    InvocationTarget,
    IInvocationEngineService,
} from '../../contracts/invocation';
import type { IBudgetService } from '../../contracts/budget';
import { EVENTS } from '../../events/event-names';
import { InvocationRepository } from './invocation-repository';

export interface AgentDirectory {
    getAgents(): Array<{ id: string; name: string; role: string; specializations?: string[] }>;
}

export interface IExecutionDelegate {
    start(
        agents: AgentRef[],
        context: InvocationContext,
        mode: ExecutionMode,
        invocationId?: string,
    ): Promise<{ target: ExecutionTarget; completed: Promise<void> }>;
}

const DEFAULT_CONSTRAINTS = { mode: 'chat' as ExecutionMode };

export class InvocationEngineService implements IInvocationEngineService {
    constructor(
        private repository: InvocationRepository,
        private eventBus: IEventBus,
        private directory: AgentDirectory,
        private execution: IExecutionDelegate,
        private budgetService?: IBudgetService,
    ) {}

    async invoke(req: InvocationRequest): Promise<Invocation> {
        const now = Date.now();
        const inv: Invocation = {
            id: genId('inv'),
            status: 'requested',
            source: req.source,
            caller: req.caller,
            target: req.target,
            resolvedAgents: [],
            reason: req.reason,
            context: req.context,
            constraints: { ...DEFAULT_CONSTRAINTS, ...(req.constraints ?? {}) },
            policyRef: '',
            createdAt: now,
            updatedAt: now,
        };
        await this.repository.put(inv);
        this.eventBus.emit(EVENTS.INVOCATION_REQUESTED, {
            invocationId: inv.id,
            caller: inv.caller,
            target: inv.target,
            context: inv.context,
        });

        const evaluation = await this.evaluate(req);
        if (evaluation.decision !== 'allow') {
            inv.status = 'rejected';
            inv.rejectionReason =
                evaluation.decision === 'deny' ? evaluation.reason : 'no matching enabled policy';
            inv.updatedAt = Date.now();
            await this.repository.put(inv);
            this.eventBus.emit(EVENTS.INVOCATION_REJECTED, {
                invocationId: inv.id,
                reason: inv.rejectionReason,
            });
            return inv;
        }

        const agents = this.resolveAgents(req.target);
        if (agents.length === 0) {
            inv.status = 'rejected';
            inv.rejectionReason = 'no agents resolved for target';
            inv.updatedAt = Date.now();
            await this.repository.put(inv);
            this.eventBus.emit(EVENTS.INVOCATION_REJECTED, {
                invocationId: inv.id,
                reason: inv.rejectionReason,
            });
            return inv;
        }

        inv.policyRef = evaluation.policy.id;
        inv.resolvedAgents = agents;
        inv.status = 'accepted';
        inv.updatedAt = Date.now();
        await this.repository.put(inv);
        this.eventBus.emit(EVENTS.INVOCATION_ACCEPTED, {
            invocationId: inv.id,
            policyRef: inv.policyRef,
            agents,
        });

        // Phase 3: pre-execution budget gate. If any resolved agent is already
        // at/over its configured budget, reject before any LLM spend occurs.
        if (this.budgetService) {
            const spentByAgent = this.budgetService.getCostByAgent();
            for (const agent of agents) {
                const budget = this.budgetService.getAgentBudget(agent.id);
                if (budget != null && (spentByAgent[agent.id] ?? 0) >= budget) {
                    inv.status = 'rejected';
                    inv.rejectionReason = `agent ${agent.id} over budget (${(spentByAgent[agent.id] ?? 0).toFixed(4)}/${budget})`;
                    inv.updatedAt = Date.now();
                    await this.repository.put(inv);
                    this.eventBus.emit(EVENTS.INVOCATION_REJECTED, {
                        invocationId: inv.id,
                        reason: inv.rejectionReason,
                    });
                    return inv;
                }
            }
        }

        const mode = inv.constraints.mode ?? evaluation.policy.actions.mode ?? 'chat';

        // Mark executing BEFORE handing off so the lifecycle is honest:
        // accepted → executing → done, with executing genuinely in-flight
        // (the run proceeds while we await `completed`). On any failure the
        // aggregate must not be orphaned in `accepted` (B-18).
        inv.status = 'executing';
        inv.updatedAt = Date.now();
        await this.repository.put(inv);

        let execution: { target: ExecutionTarget; completed: Promise<void> };
        try {
            execution = await this.execution.start(agents, req.context, mode, inv.id);
        } catch (e) {
            inv.status = 'rejected';
            inv.rejectionReason = e instanceof Error ? e.message : String(e);
            inv.updatedAt = Date.now();
            await this.repository.put(inv);
            this.eventBus.emit(EVENTS.INVOCATION_REJECTED, {
                invocationId: inv.id,
                reason: inv.rejectionReason,
            });
            return inv;
        }

        inv.sessionRef = execution.target;
        inv.updatedAt = Date.now();
        await this.repository.put(inv);
        this.eventBus.emit(EVENTS.INVOCATION_EXECUTING, {
            invocationId: inv.id,
            sessionRef: execution.target,
        });

        try {
            await execution.completed;
        } catch (e) {
            inv.status = 'rejected';
            inv.rejectionReason = e instanceof Error ? e.message : String(e);
            inv.updatedAt = Date.now();
            await this.repository.put(inv);
            this.eventBus.emit(EVENTS.INVOCATION_REJECTED, {
                invocationId: inv.id,
                reason: inv.rejectionReason,
            });
            return inv;
        }

        inv.status = 'done';
        inv.updatedAt = Date.now();
        await this.repository.put(inv);
        this.eventBus.emit(EVENTS.INVOCATION_DONE, {
            invocationId: inv.id,
            resultRef: execution.target.ref,
        });

        return inv;
    }

    async handleAgentRequest(
        requestingAgent: AgentRef,
        desired: InvocationTarget,
        context: InvocationContext,
    ): Promise<Invocation | { rejected: string }> {
        const synthetic: InvocationRequest = {
            source: 'module-event',
            caller: { kind: 'event', id: requestingAgent.id },
            target: desired,
            reason: 'agent-initiated request',
            context,
        };
        const evaluation = await this.evaluate(synthetic);
        if (evaluation.decision !== 'allow') {
            return { rejected: 'no matching policy for agent-initiated invocation' };
        }
        if (!evaluation.policy.allowAgentInitiatedInvocation) {
            return { rejected: 'policy does not allow agent-initiated invocation' };
        }
        return this.invoke(synthetic);
    }

    async getInvocation(id: string): Promise<Invocation | undefined> {
        return this.repository.get(id);
    }

    async listPolicies(): Promise<InvocationPolicy[]> {
        return this.repository.listPolicies();
    }

    async createPolicy(policy: Omit<InvocationPolicy, 'id'>): Promise<InvocationPolicy> {
        return this.repository.createPolicy(policy);
    }

    private resolveAgents(target: InvocationTarget): AgentRef[] {
        const all = this.directory.getAgents();
        if ('agentId' in target) {
            return [{ id: target.agentId }];
        }
        if ('role' in target) {
            return all
                .filter(
                    (a) =>
                        a.role === target.role || (a.specializations ?? []).includes(target.role),
                )
                .map((a) => ({ id: a.id, role: a.role, expertise: a.specializations }));
        }
        return all
            .filter((a) => (a.specializations ?? []).some((s) => target.expertise.includes(s)))
            .map((a) => ({ id: a.id, role: a.role, expertise: a.specializations }));
    }

    private async evaluate(
        req: InvocationRequest,
    ): Promise<
        | { decision: 'allow'; policy: InvocationPolicy; resolvedTarget: InvocationTarget }
        | { decision: 'deny'; reason: string; policy?: InvocationPolicy }
        | { decision: 'no-match' }
    > {
        const policies = await this.repository.listPolicies();
        const candidates = policies.filter((p) => p.enabled && this.matches(p, req));
        if (candidates.length === 0) return { decision: 'no-match' };
        candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        const policy = candidates[0]!;
        return { decision: 'allow', policy, resolvedTarget: policy.actions.target };
    }

    private matches(policy: InvocationPolicy, req: InvocationRequest): boolean {
        const m = policy.match;
        const target = req.target;
        if (m.source && m.source !== req.source) return false;
        if (m.event && req.source === 'module-event' && m.event !== req.caller.id) return false;
        if (m.expertise && 'expertise' in target) {
            const exp = (target as { expertise: string[] }).expertise;
            const overlap = m.expertise.some((e) => exp.includes(e));
            if (!overlap) return false;
        }
        return true;
    }
}
