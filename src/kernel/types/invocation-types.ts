import type {
    AgentRef,
    ExecutionTarget,
    InvocationConstraints,
    InvocationPolicy,
    InvocationSource,
    InvocationStatus,
    InvocationTarget,
} from '../contracts/invocation';

export interface InvocationRecord {
    id: string;
    status: InvocationStatus;
    source: InvocationSource;
    callerKind: string;
    callerId: string;
    target: InvocationTarget;
    resolvedAgents: AgentRef[];
    reason: string;
    contextType: string;
    contextRef: string;
    constraints: InvocationConstraints;
    policyRef: string;
    sessionRef?: ExecutionTarget;
    rejectionReason?: string;
    createdAt: number;
    updatedAt: number;
}

export interface InvocationPolicyRecord {
    id: string;
    name: string;
    enabled: boolean;
    createdBy: string;
    domain?: string;
    topicPattern?: string;
    expertise?: string[];
    event?: string;
    schedule?: string;
    source?: InvocationSource;
    target: InvocationTarget;
    mode?: 'chat' | 'debate' | 'director-scenario';
    allowAgentInitiatedInvocation: boolean;
    priority?: number;
}

export type { InvocationPolicy };

/**
 * Per-invocation cost accumulator (cost-attribution Phase 1).
 *
 * Keyed by `invocationId`; updated on every `chat:stream:end` that carries an
 * `invocationId`. `accumulatedCost` is in USD; `turnCount` is the number of
 * streamed turns attributed to the invocation.
 */
export interface InvocationCostRecord {
    invocationId: string;
    accumulatedCost: number;
    turnCount: number;
    firstSeenAt: number;
    updatedAt: number;
}
