import { genId } from '../../utils/gen-id';
import { rootLogger } from './logger-service';
import type { DeadLetterEntry, IDeadLetterQueue } from '../contracts/dead-letter-queue';

const LOGGER = rootLogger.child('DeadLetterQueue');

const DLQ_STORAGE_KEY = 'super_agents_dlq';
const MAX_ENTRIES = 500;

export class DeadLetterQueueService implements IDeadLetterQueue {
    private entries: DeadLetterEntry[] = [];
    private deps: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    private _initialized = false;

    constructor(deps: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    }) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const saved = await this.deps.getKv<DeadLetterEntry[]>(DLQ_STORAGE_KEY);
            if (saved) this.entries = saved;
        } catch (e) {
            LOGGER.warn('DeadLetterQueue', 'Failed to load', { error: String(e) });
        }
    }

    async push(entry: Omit<DeadLetterEntry, 'id' | 'failedAt'>): Promise<void> {
        const dlqEntry: DeadLetterEntry = {
            ...entry,
            id: genId('dlq'),
            failedAt: Date.now(),
        };
        this.entries.push(dlqEntry);
        if (this.entries.length > MAX_ENTRIES) {
            this.entries = this.entries.slice(-MAX_ENTRIES);
        }
        await this.persist();
        LOGGER.warn('DeadLetterQueue', 'Event pushed to DLQ', {
            event: entry.event,
            error: entry.error,
            id: dlqEntry.id,
        });
    }

    async list(): Promise<DeadLetterEntry[]> {
        return [...this.entries];
    }

    async retry(id: string): Promise<boolean> {
        const idx = this.entries.findIndex((e) => e.id === id);
        if (idx === -1) return false;
        this.entries[idx]!.retryCount++;
        this.entries[idx]!.lastError = undefined;
        await this.persist();
        return true;
    }

    async remove(id: string): Promise<void> {
        this.entries = this.entries.filter((e) => e.id !== id);
        await this.persist();
    }

    async clear(): Promise<void> {
        this.entries = [];
        await this.persist();
    }

    async count(): Promise<number> {
        return this.entries.length;
    }

    private async persist(): Promise<void> {
        try {
            await this.deps.setKv(DLQ_STORAGE_KEY, this.entries);
        } catch (e) {
            LOGGER.warn('DeadLetterQueue', 'Failed to persist', { error: String(e) });
        }
    }
}
