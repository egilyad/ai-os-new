import type { IDatabaseService } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import type { Invocation, InvocationPolicy } from '../../contracts/invocation';
import type { InvocationRecord, InvocationPolicyRecord } from '../../types/invocation-types';

export class InvocationRepository {
    constructor(private db: IDatabaseService) {}

    private toRecord(inv: Invocation): InvocationRecord {
        return {
            id: inv.id,
            status: inv.status,
            source: inv.source,
            callerKind: inv.caller.kind,
            callerId: inv.caller.id,
            target: inv.target,
            resolvedAgents: inv.resolvedAgents,
            reason: inv.reason,
            contextType: inv.context.type,
            contextRef: inv.context.ref,
            constraints: inv.constraints,
            policyRef: inv.policyRef,
            sessionRef: inv.sessionRef,
            rejectionReason: inv.rejectionReason,
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
        };
    }

    private fromRecord(r: InvocationRecord): Invocation {
        return {
            id: r.id,
            status: r.status,
            source: r.source,
            caller: { kind: r.callerKind as 'human' | 'event' | 'schedule', id: r.callerId },
            target: r.target,
            resolvedAgents: r.resolvedAgents,
            reason: r.reason,
            context: {
                type: r.contextType as 'forum-topic' | 'room' | 'conversation',
                ref: r.contextRef,
            },
            constraints: r.constraints,
            policyRef: r.policyRef,
            sessionRef: r.sessionRef,
            rejectionReason: r.rejectionReason,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    }

    async put(inv: Invocation): Promise<void> {
        await this.db.invocations.put(this.toRecord(inv));
    }

    async get(id: string): Promise<Invocation | undefined> {
        const r = await this.db.invocations.get(id);
        return r ? this.fromRecord(r) : undefined;
    }

    async list(): Promise<Invocation[]> {
        const rows = await this.db.invocations.toArray();
        return rows.map((r) => this.fromRecord(r));
    }

    private policyToRecord(p: InvocationPolicy): InvocationPolicyRecord {
        return {
            id: p.id,
            name: p.name,
            enabled: p.enabled,
            createdBy: p.createdBy,
            domain: p.match.domain,
            topicPattern: p.match.topicPattern,
            expertise: p.match.expertise,
            event: p.match.event,
            schedule: p.match.schedule,
            source: p.match.source,
            target: p.actions.target,
            mode: p.actions.mode,
            allowAgentInitiatedInvocation: p.allowAgentInitiatedInvocation,
            priority: p.priority,
        };
    }

    private policyFromRecord(r: InvocationPolicyRecord): InvocationPolicy {
        return {
            id: r.id,
            name: r.name,
            enabled: r.enabled,
            createdBy: r.createdBy,
            match: {
                domain: r.domain,
                topicPattern: r.topicPattern,
                expertise: r.expertise,
                event: r.event,
                schedule: r.schedule,
                source: r.source,
            },
            actions: { target: r.target, mode: r.mode },
            allowAgentInitiatedInvocation: r.allowAgentInitiatedInvocation,
            priority: r.priority,
        };
    }

    async listPolicies(): Promise<InvocationPolicy[]> {
        const rows = await this.db.invocationPolicies.toArray();
        return rows.map((r) => this.policyFromRecord(r));
    }

    async createPolicy(input: Omit<InvocationPolicy, 'id'>): Promise<InvocationPolicy> {
        const policy: InvocationPolicy = { ...input, id: genId('invpolicy') };
        await this.db.invocationPolicies.put(this.policyToRecord(policy));
        return policy;
    }
}
