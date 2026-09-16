/**
 * Builder Agent domain types (plan §7).
 *
 * The Builder Agent generates cognitive topologies (WorkflowManifest)
 * from natural language prompts, validates them against system contracts,
 * compiles them into executable event-driven flows (CompiledFlow), and deploys them.
 */

export type FlowId = string;

export type WorkflowNodeType =
    'agent' | 'debate' | 'junction' | 'forum' | 'synthesis' | 'interpretation' | 'gate';

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    label: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    from: string;
    to: string;
    trigger?: string;
    condition?: string;
}

export type WorkflowStatus = 'draft' | 'validated' | 'compiled' | 'deployed' | 'deprecated';

export interface WorkflowManifest {
    workflow_id: FlowId;
    title: string;
    description: string;
    version: number;
    status: WorkflowStatus;
    trigger: {
        kind: 'event' | 'schedule' | 'manual';
        source: string;
    };
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    createdAt: number;
    updatedAt: number;
}

export interface ValidationError {
    nodeId?: string;
    code: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export interface CompiledStep {
    stepId: string;
    nodeType: WorkflowNodeType;
    handlerEvent: string;
    outputEvent: string;
    config: Record<string, unknown>;
    checkpointEnabled: boolean;
}

export interface CompiledFlow {
    flowId: FlowId;
    manifestVersion: number;
    compiledAt: number;
    steps: CompiledStep[];
    entryEvent: string;
    exitEvent: string;
}

export interface WorkflowRecord {
    id: FlowId;
    title: string;
    status: WorkflowStatus;
    version: number;
    nodeCount: number;
    createdAt: number;
    updatedAt: number;
    manifest?: WorkflowManifest;
    compiledFlow?: CompiledFlow;
}
