import { EVENTS } from '../events/event-names';
import type { ITransaction } from '../contracts/transaction';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('Transaction');

export class TransactionContext implements ITransaction {
    private pendingEmits: Array<{ event: string; data: unknown }> = [];
    private pendingPersists: Array<{
        persist: () => Promise<void>;
        compensate?: () => Promise<void>;
    }> = [];
    private commitCbs: Array<() => void> = [];
    private rollbackCbs: Array<() => void> = [];
    private _committed = false;
    private _rolledBack = false;
    private _committing = false;
    private _commitPromise: Promise<void> | null = null;

    readonly source: string;

    constructor(source = 'unknown') {
        this.source = source;
    }

    /** CoW: deep-clone state for rollback restoration. Returns frozen clone. */
    capture<T>(state: T): T {
        return structuredClone(state);
    }

    deferEmit(event: string, data?: unknown): void {
        if (this._committed || this._rolledBack || this._committing) return;
        this.pendingEmits.push({ event, data });
    }

    deferPersist(fn: () => Promise<void>, compensate?: () => Promise<void>): void {
        if (this._committed || this._rolledBack || this._committing) return;
        this.pendingPersists.push({ persist: fn, compensate });
    }

    onCommit(cb: () => void): void {
        if (this._committed) return;
        this.commitCbs.push(cb);
    }

    onRollback(cb: () => void): void {
        if (this._rolledBack) return;
        this.rollbackCbs.push(cb);
    }

    async commit(eventBus?: { emit: (event: string, data?: unknown) => void }): Promise<void> {
        if (this._committed || this._rolledBack) return;
        if (this._commitPromise) return this._commitPromise;
        this._committing = true;
        this._commitPromise = this._doCommit(eventBus);
        return this._commitPromise;
    }

    private async _doCommit(eventBus?: {
        emit: (event: string, data?: unknown) => void;
    }): Promise<void> {
        const completed: number[] = [];
        try {
            for (let i = 0; i < this.pendingPersists.length; i++) {
                await this.pendingPersists[i]!.persist();
                completed.push(i);
            }
        } catch (e) {
            LOGGER.error(
                'Transaction',
                `commit failed for "${this.source}", rolling back ${completed.length} completed persists`,
                { error: e },
            );
            for (let i = completed.length - 1; i >= 0; i--) {
                const compensate = this.pendingPersists[completed[i]!]?.compensate;
                if (compensate) {
                    try {
                        await compensate();
                    } catch (ce) {
                        LOGGER.error(
                            'Transaction',
                            `Compensating action failed for persist #${completed[i]}`,
                            { error: ce },
                        );
                    }
                }
            }
            await this.rollback(eventBus);
            throw e;
        } finally {
            this._committing = false;
            this._commitPromise = null;
        }
        this._committed = true;
        for (const { event, data } of this.pendingEmits) {
            eventBus?.emit(event, data);
        }
        for (const cb of this.commitCbs) cb();
    }

    async rollback(eventBus?: { emit: (event: string, data?: unknown) => void }): Promise<void> {
        if (this._committed || this._rolledBack) return;
        this._rolledBack = true;
        this._commitPromise = null;

        const emitCount = this.pendingEmits.length;
        const persistCount = this.pendingPersists.length;

        if (emitCount > 0 || persistCount > 0) {
            LOGGER.warn(
                'Transaction',
                `rollback from "${this.source}": dropped ${emitCount} deferred emits, ${persistCount} deferred persists`,
            );
            if (eventBus) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Transaction rollback [${this.source}]: ${emitCount} events, ${persistCount} persists discarded`,
                    type: 'warning',
                    source: 'Transaction',
                });
            }
        }

        for (const cb of this.rollbackCbs) cb();
        this.pendingEmits = [];
        this.pendingPersists = [];
        this.commitCbs = [];
        this.rollbackCbs = [];
    }
}
