import type { ILifecycle } from './lifecycle';
import type {
    CompiledFlow,
    FlowId,
    ValidationResult,
    WorkflowManifest,
} from '../types/builder-types';

/**
 * Builder Agent — AI cognitive topology generator and compiler (plan §7).
 *
 * Drives topology creation:
 *   1. generate(prompt) -> WorkflowManifest
 *   2. validate(manifest) -> ValidationResult
 *   3. compile(manifest) -> CompiledFlow
 *   4. deploy(flowId) -> registers event-driven workflow
 *   5. listFlows() -> list manifests
 */
export interface IBuilderAgentService extends ILifecycle {
    /** Generate a workflow manifest topology from natural language prompt. */
    generate(input: { prompt: string }): Promise<WorkflowManifest>;
    /** Validate a manifest against system contracts and topological safety rules. */
    validate(manifest: WorkflowManifest): Promise<ValidationResult>;
    /** Compile a manifest into an event-driven compiled pipeline. */
    compile(manifest: WorkflowManifest): Promise<CompiledFlow>;
    /** Deploy a compiled workflow into the runtime. */
    deploy(flowId: FlowId): Promise<void>;
    /** List all stored workflow manifests. */
    listFlows(): Promise<WorkflowManifest[]>;
    /** Get a specific workflow manifest by id. */
    getFlow(flowId: FlowId): Promise<WorkflowManifest | null>;
}
