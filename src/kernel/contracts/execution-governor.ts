export type OperationType =
  | 'llm-call'
  | 'stream'
  | 'debate'
  | 'round'
  | 'memory-index'
  | 'cognitive-trace'
  | 'send-message'
  | 'probe'
  | 'health-check';

export type OperationState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed-out';

export interface OperationSpec {
  type: OperationType;
  id?: string;
  timeoutMs: number;
  parentId?: string;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface ManagedOperation {
  readonly id: string;
  readonly type: OperationType;
  readonly parentId: string | null;
  readonly state: OperationState;
  readonly signal: AbortSignal;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly metadata: Readonly<Record<string, unknown>>;

  complete(): void;
  fail(error: Error): void;
  cancel(): void;
  child(spec: Omit<OperationSpec, 'parentId'>): ManagedOperation;
}

export interface OperationFilter {
  type?: OperationType;
  state?: OperationState;
  parentId?: string;
}

export interface IExecutionGovernor {
  start(spec: OperationSpec): ManagedOperation;
  get(id: string): ManagedOperation | undefined;
  list(filter?: OperationFilter): ManagedOperation[];
  cancelTree(rootId: string): Promise<void>;
  getDescendants(id: string): ManagedOperation[];
  drain(timeoutMs: number): Promise<void>;
  readonly activeCount: number;
}
