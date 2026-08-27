import type {
    IExecutionGovernor,
    OperationSpec,
    ManagedOperation,
    OperationState,
    OperationType,
    OperationFilter,
} from '../contracts/execution-governor';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ExecutionGovernor');

let _nextId = 0;
function genId(): string {
    return `op-${Date.now().toString(36)}-${(++_nextId).toString(36)}`;
}

class ManagedOperationImpl implements ManagedOperation {
    readonly id: string;
    readonly type: OperationType;
    readonly parentId: string | null;
    readonly startedAt: number;
    readonly metadata: Readonly<Record<string, unknown>>;
    private _state: OperationState = 'pending';
    private _endedAt: number | null = null;
    private _abortController: AbortController;
    private _parentAbortHandler: (() => void) | null = null;
    private _parentAbortSignal: AbortSignal | null = null; // H-32: track signal for cleanup
    private _onStateChange: ((op: ManagedOperationImpl) => void) | null;

    constructor(spec: OperationSpec, onStateChange: ((op: ManagedOperationImpl) => void) | null) {
        this.id = spec.id ?? genId();
        this.type = spec.type;
        this.parentId = spec.parentId ?? null;
        this.startedAt = Date.now();
        this.metadata = Object.freeze({ ...spec.metadata });
        this._onStateChange = onStateChange;
        this._abortController = new AbortController();

        if (spec.signal) {
            if (spec.signal.aborted) {
                this._state = 'cancelled';
                this._endedAt = Date.now();
            } else {
                this._parentAbortSignal = spec.signal; // H-32: store signal reference
                this._parentAbortHandler = () => this.cancel();
                spec.signal.addEventListener('abort', this._parentAbortHandler, { once: true });
            }
        }

        if (this._state !== 'cancelled') {
            this._state = 'running';
        }
    }

    get state(): OperationState {
        return this._state;
    }
    get signal(): AbortSignal {
        return this._abortController.signal;
    }
    get endedAt(): number | null {
        return this._endedAt;
    }

    complete(): void {
        if (this._state !== 'running') return;
        this._state = 'completed';
        this._endedAt = Date.now();
        this._cleanup();
        this._notify();
    }

    fail(error: Error): void {
        if (this._state !== 'running') return;
        this._state = 'failed';
        this._endedAt = Date.now();
        this._cleanup();
        this._notify();
        LOGGER.warn('ExecutionGovernor', `Operation ${this.id} failed`, {
            type: this.type,
            error: error.message,
        });
    }

    cancel(): void {
        if (this._endedAt !== null) return;
        this._state = 'cancelled';
        this._endedAt = Date.now();
        this._abortController.abort(new Error('CancelledByGovernor'));
        this._cleanup();
        this._notify();
        LOGGER.warn('ExecutionGovernor', `Operation ${this.id} cancelled`, {
            type: this.type,
        });
    }

    timeout(): void {
        if (this._endedAt !== null) return;
        this._state = 'timed-out';
        this._endedAt = Date.now();
        this._abortController.abort(new Error('OperationTimedOut'));
        this._cleanup();
        this._notify();
        LOGGER.warn('ExecutionGovernor', `Operation ${this.id} timed out`, {
            type: this.type,
            timeoutMs: Date.now() - this.startedAt,
            metadata: this.metadata,
        });
    }

    child(spec: Omit<OperationSpec, 'parentId'>): ManagedOperation {
        return new ManagedOperationImpl({ ...spec, parentId: this.id }, null);
    }

    private _cleanup(): void {
        // H-32: Actually remove the listener, not just null the reference
        if (this._parentAbortHandler && this._parentAbortSignal) {
            this._parentAbortSignal.removeEventListener('abort', this._parentAbortHandler);
            this._parentAbortHandler = null;
            this._parentAbortSignal = null;
        }
    }

    private _notify(): void {
        if (this._onStateChange) {
            this._onStateChange(this);
        }
    }
}

export class ExecutionGovernorService implements IExecutionGovernor {
    private _operations = new Map<string, ManagedOperationImpl>();
    private _children = new Map<string, Set<string>>();
    private _timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();

    get activeCount(): number {
        let count = 0;
        for (const op of this._operations.values()) {
            if (op.state === 'running' || op.state === 'pending') count++;
        }
        return count;
    }

    start(spec: OperationSpec): ManagedOperation {
        const op = new ManagedOperationImpl(spec, (changed) => this._onOpStateChange(changed));
        this._operations.set(op.id, op);

        if (op.parentId) {
            const siblings = this._children.get(op.parentId) ?? new Set();
            siblings.add(op.id);
            this._children.set(op.parentId, siblings);
        }

        if (spec.timeoutMs > 0 && spec.timeoutMs < Infinity) {
            const timer = setTimeout(() => {
                const existing = this._operations.get(op.id);
                if (existing && existing.state === 'running') {
                    existing.timeout();
                    this._removeOp(op.id);
                }
                this._timeoutTimers.delete(op.id);
            }, spec.timeoutMs);
            this._timeoutTimers.set(op.id, timer);
        }

        return op;
    }

    get(id: string): ManagedOperation | undefined {
        return this._operations.get(id);
    }

    list(filter?: OperationFilter): ManagedOperation[] {
        const all = Array.from(this._operations.values());
        if (!filter) return all;
        return all.filter((op) => {
            if (filter.type && op.type !== filter.type) return false;
            if (filter.state && op.state !== filter.state) return false;
            if (filter.parentId !== undefined && op.parentId !== filter.parentId) return false;
            return true;
        });
    }

    getDescendants(id: string): ManagedOperation[] {
        const result: ManagedOperation[] = [];
        const walk = (nodeId: string) => {
            const children = this._children.get(nodeId);
            if (!children) return;
            for (const childId of children) {
                const op = this._operations.get(childId);
                if (op) result.push(op);
                walk(childId);
            }
        };
        walk(id);
        return result;
    }

    async cancelTree(rootId: string): Promise<void> {
        const descendants = this.getDescendants(rootId);
        const root = this._operations.get(rootId);
        const all = root ? [root, ...descendants] : descendants;
        for (const op of all) {
            (op as ManagedOperationImpl).cancel();
        }
        for (const op of all) {
            this._removeOp(op.id);
        }
    }

    async drain(timeoutMs: number): Promise<void> {
        const start = Date.now();
        const running = Array.from(this._operations.values()).filter(
            (op) => op.state === 'running' || op.state === 'pending',
        );
        if (running.length === 0) return;

        for (const op of running) {
            (op as ManagedOperationImpl).cancel();
        }

        const deadline = start + timeoutMs;
        while (Date.now() < deadline) {
            const remaining = Array.from(this._operations.values()).filter(
                (op) => op.state === 'running' || op.state === 'pending',
            );
            if (remaining.length === 0) break;
            await new Promise((r) => setTimeout(r, 10));
        }
    }

    private _onOpStateChange(op: ManagedOperationImpl): void {
        if (op.state !== 'running' && op.state !== 'pending') {
            this._removeTimer(op.id);
            this._removeOp(op.id);
        }
    }

    private _removeOp(id: string): void {
        this._removeTimer(id);
        this._operations.delete(id);
        this._children.delete(id);
        for (const [, siblings] of this._children) {
            siblings.delete(id);
        }
    }

    private _removeTimer(id: string): void {
        const timer = this._timeoutTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this._timeoutTimers.delete(id);
        }
    }

    destroy(): void {
        for (const [, timer] of this._timeoutTimers) clearTimeout(timer);
        this._timeoutTimers.clear();
        for (const op of this._operations.values()) (op as ManagedOperationImpl).cancel();
        this._operations.clear();
        this._children.clear();
    }
}
