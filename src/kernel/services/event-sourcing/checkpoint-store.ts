export interface Checkpoint {
    readonly id: string;
    readonly label: string;
    readonly sequence: number;
    readonly timestamp: number;
    readonly stateSnapshot: unknown;
    readonly tags?: string[];
    readonly description?: string;
}

export interface CheckpointStoreConfig {
    readonly maxCheckpoints: number;
    readonly autoCheckpointInterval: number;
}

export interface CheckpointPersistenceStore {
    load(): Promise<Checkpoint[] | null>;
    save(checkpoints: Checkpoint[]): Promise<void>;
}

import { rootLogger } from '../logger-service';
import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { ssrSafeStorage } from '../../../kernel/utils/ssr-storage';

const LOGGER = rootLogger.child('CheckpointStore');

const DEFAULT_CONFIG: CheckpointStoreConfig = {
    maxCheckpoints: 50,
    autoCheckpointInterval: 0,
};

export class CheckpointStore {
    private checkpoints: Checkpoint[] = [];
    private config: CheckpointStoreConfig;
    private autoInterval: ReturnType<typeof setInterval> | null = null;
    private store?: CheckpointPersistenceStore;
    private persistQueued = false;
    private _initialized = false;

    constructor(config?: Partial<CheckpointStoreConfig>, store?: CheckpointPersistenceStore) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.store = store;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        if (!this.store) return;
        try {
            const checkpoints = await this.store.load();
            if (!checkpoints) return;
            this.checkpoints = checkpoints.slice(-this.config.maxCheckpoints);
        } catch (e) {
            LOGGER.warn('CheckpointStore', 'Failed to restore persisted checkpoints', { error: e });
        }
        await this.recoverFromWal();
    }

    create(
        label: string,
        sequence: number,
        stateSnapshot: unknown,
        options?: { tags?: string[]; description?: string },
    ): Checkpoint {
        const cp: Checkpoint = {
            id: `cp-${crypto.randomUUID()}`,
            label,
            sequence,
            timestamp: Date.now(),
            stateSnapshot,
            tags: options?.tags,
            description: options?.description,
        };
        this.checkpoints.push(cp);
        if (this.checkpoints.length > this.config.maxCheckpoints) {
            this.checkpoints = this.checkpoints.slice(-this.config.maxCheckpoints);
        }
        this.schedulePersist();
        return cp;
    }

    get(id: string): Checkpoint | undefined {
        return this.checkpoints.find((cp) => cp.id === id);
    }

    getLatest(): Checkpoint | null {
        if (this.checkpoints.length === 0) return null;
        return this.checkpoints[this.checkpoints.length - 1]!;
    }

    getBySequence(sequence: number): Checkpoint | undefined {
        return [...this.checkpoints]
            .sort((a, b) => b.sequence - a.sequence)
            .find((cp) => cp.sequence <= sequence);
    }

    getByLabel(label: string): Checkpoint[] {
        return this.checkpoints.filter((cp) => cp.label.includes(label));
    }

    getByTag(tag: string): Checkpoint[] {
        return this.checkpoints.filter((cp) => cp.tags?.includes(tag));
    }

    getAll(): Checkpoint[] {
        return [...this.checkpoints];
    }

    getRecent(count: number): Checkpoint[] {
        return this.checkpoints.slice(-count).reverse();
    }

    remove(id: string): boolean {
        const before = this.checkpoints.length;
        this.checkpoints = this.checkpoints.filter((cp) => cp.id !== id);
        if (this.checkpoints.length < before) this.schedulePersist();
        return this.checkpoints.length < before;
    }

    clear(): void {
        this.checkpoints = [];
        this.schedulePersist();
    }

    getCount(): number {
        return this.checkpoints.length;
    }

    startAutoCheckpoint(
        getSnapshot: () => unknown,
        getSequence: () => number,
        labelPrefix = 'auto',
    ): void {
        this.stopAutoCheckpoint();
        if (this.config.autoCheckpointInterval <= 0) return;
        this.autoInterval = setInterval(() => {
            const seq = getSequence();
            this.create(`${labelPrefix}-${seq}`, seq, getSnapshot(), { tags: ['auto'] });
        }, this.config.autoCheckpointInterval);
    }

    stopAutoCheckpoint(): void {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }

    updateConfig(partial: Partial<CheckpointStoreConfig>): void {
        this.config = { ...this.config, ...partial };
    }

    exportCheckpoints(): string {
        return JSON.stringify({ checkpoints: this.checkpoints });
    }

    importCheckpoints(json: string): number {
        try {
            const data = safeJsonParse(json) as Record<string, unknown> | undefined;
            const imported: Checkpoint[] =
                ((data as Record<string, unknown>)?.checkpoints as Checkpoint[]) ?? [];
            let count = 0;
            for (const cp of imported) {
                if (!this.checkpoints.some((c) => c.id === cp.id)) {
                    this.checkpoints.push(cp);
                    count++;
                }
            }
            if (count > 0) this.schedulePersist();
            return count;
        } catch (e) {
            LOGGER.warn('CheckpointStore', 'Import checkpoints failed', { error: e });
            return 0;
        }
    }

    destroy(): void {
        this.stopAutoCheckpoint();
        this.checkpoints = [];
    }

    private schedulePersist(): void {
        if (!this.store || this.persistQueued) return;
        this.persistQueued = true;
        // Write to WAL immediately for crash recovery
        const walKey = 'checkpoint-store:wal';
        try {
            ssrSafeStorage.setItem(walKey, JSON.stringify(this.checkpoints));
        } catch {
            /* best-effort */
        }
        queueMicrotask(() => {
            this.persistQueued = false;
            this.store
                ?.save([...this.checkpoints])
                .then(() => {
                    // Clear WAL after successful persist
                    try {
                        ssrSafeStorage.removeItem(walKey);
                    } catch {
                        /* best-effort */
                    }
                })
                .catch((e) =>
                    LOGGER.warn('CheckpointStore', 'Failed to persist checkpoints', { error: e }),
                );
        });
    }

    /** Call from init() to recover any WAL data from a prior tab-close */
    async recoverFromWal(): Promise<void> {
        const walKey = 'checkpoint-store:wal';
        try {
            const wal = ssrSafeStorage.getItem(walKey);
            if (wal) {
                ssrSafeStorage.removeItem(walKey);
                const recovered = safeJsonParse(wal) as Checkpoint[] | null;
                if (recovered && Array.isArray(recovered) && recovered.length > 0) {
                    for (const cp of recovered) {
                        if (!this.checkpoints.some((c) => c.id === cp.id)) {
                            this.checkpoints.push(cp);
                        }
                    }
                    if (this.checkpoints.length > this.config.maxCheckpoints) {
                        this.checkpoints = this.checkpoints.slice(-this.config.maxCheckpoints);
                    }
                    if (this.store) {
                        await this.store.save([...this.checkpoints]);
                    }
                    LOGGER.info(
                        'CheckpointStore',
                        `Recovered ${recovered.length} checkpoints from WAL`,
                    );
                }
            }
        } catch {
            /* best-effort */
        }
    }
}
