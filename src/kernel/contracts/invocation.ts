export type InvocationSource =
    | 'human-mention'
    | 'human-expert-request'
    | 'expertise-match'
    | 'module-event'
    | 'consensus-request'
    | 'schedule';

export interface InvocationCaller {
    kind: 'human' | 'event' | 'schedule';
    id: string;
}

export type InvocationTarget = { agentId: string } | { role: string } | { expertise: string[] };

export type InvocationContext =
    | { type: 'forum-topic'; ref: string }
    | { type: 'room'; ref: string }
    | { type: 'conversation'; ref: string }
    | { type: 'scheduled'; ref: string };

export type ExecutionMode = 'chat' | 'debate' | 'director-scenario';

export interface InvocationConstraints {
    maxTurns?: number;
    mode?: ExecutionMode;
    ttlMs?: number;
    policyRef?: string;
}

export interface AgentRef {
    id: string;
    role?: string;
    expertise?: string[];
}

export type InvocationStatus = 'requested' | 'accepted' | 'rejected' | 'executing' | 'done';

export interface Invocation {
    id: string;
    status: InvocationStatus;
    source: InvocationSource;
    caller: InvocationCaller;
    target: InvocationTarget;
    resolvedAgents: AgentRef[];
    reason: string;
    context: InvocationContext;
    constraints: InvocationConstraints;
    policyRef: string;
    sessionRef?: ExecutionTarget;
    rejectionReason?: string;
    createdAt: number;
    updatedAt: number;
}

export interface InvocationPolicyMatch {
    domain?: string;
    topicPattern?: string;
    expertise?: string[];
    event?: string;
    schedule?: string;
    source?: InvocationSource;
}

export interface InvocationPolicy {
    id: string;
    name: string;
    enabled: boolean;
    createdBy: string;
    match: InvocationPolicyMatch;
    actions: { target: InvocationTarget; mode?: ExecutionMode };
    allowAgentInitiatedInvocation: boolean;
    priority?: number;
}

export type PolicyEvaluation =
    | { decision: 'allow'; policy: InvocationPolicy; resolvedTarget: InvocationTarget }
    | { decision: 'deny'; reason: string; policy?: InvocationPolicy }
    | { decision: 'no-match' };

export type ExecutionTarget =
    | { kind: 'conversation'; ref: string }
    | { kind: 'debate'; ref: string }
    | { kind: 'room'; ref: string };

export interface InvocationRequest {
    source: InvocationSource;
    caller: InvocationCaller;
    target: InvocationTarget;
    reason: string;
    context: InvocationContext;
    constraints?: InvocationConstraints;
}

export interface IInvocationEngineService {
    invoke(req: InvocationRequest): Promise<Invocation>;
    handleAgentRequest(
        requestingAgent: AgentRef,
        desired: InvocationTarget,
        context: InvocationContext,
    ): Promise<Invocation | { rejected: string }>;
    getInvocation(id: string): Promise<Invocation | undefined>;
    listPolicies(): Promise<InvocationPolicy[]>;
    createPolicy(policy: Omit<InvocationPolicy, 'id'>): Promise<InvocationPolicy>;
}
