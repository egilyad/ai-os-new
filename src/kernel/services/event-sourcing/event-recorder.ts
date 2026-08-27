export type { Checkpoint } from './checkpoint-store';

import type { RecordedEvent, EventFilter } from './event-types';

export type { RecordedEvent, EventFilter };

export interface RecorderConfig {
    maxEvents: number;
    enabled: boolean;
    filter?: EventFilter;
}

export interface EventRecorderStore {
    load(): Promise<{ events: RecordedEvent[]; sequence: number } | null>;
    save(snapshot: { events: RecordedEvent[]; sequence: number }): Promise<void>;
    clearAll?(): Promise<void>;
}

import { CONFIG } from '../config-registry';
import { rootLogger } from '../logger-service';
import { CheckpointStore, type Checkpoint, type CheckpointStoreConfig } from './checkpoint-store';
import type { KvRepository } from '../../dal/repository-types';
import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { ssrSafeStorage } from '../../../kernel/utils/ssr-storage';

const LOGGER = rootLogger.child('EventRecorder');

const DEFAULT_CONFIG: RecorderConfig = {
    maxEvents: CONFIG?.services?.eventRecorder?.maxEvents ?? 1000,
    enabled: true,
};

/**
 * High-frequency / streaming events that must NOT be recorded. During a debate
 * each LLM chunk emits `debate:runtime:agent:chunk`; recording these floods the
 * event array with thousands of entries, triggers a full-array JSON.stringify +
 * localStorage WAL write + Dexie bulkAdd on EVERY event (observed: heap grew to
 * ~1.2GB and LLM calls timed out because the event loop was saturated). These
 * events carry no durable value — skip them entirely.
 */
const NOISY_EVENTS = new Set<string>([
    'debate:runtime:agent:chunk',
    'debate:runtime:agent:thinking',
    'chat:stream:chunk',
    'chat:stream:start',
    'chat:stream:end',
    'stream:chunk',
    'stream:start',
    'stream:end',
]);

function isNoisyEvent(event: string): boolean {
    return NOISY_EVENTS.has(event);
}

export class EventRecorder {
    private events: RecordedEvent[] = [];
    private sequence = 0;
    private config: RecorderConfig;
    private unsub: (() => void) | null = null;
    private store?: EventRecorderStore;
    private persistQueued = false;
    /** P1-15.3: generation counter prevents stale microtask from overwriting cleared state */
    private _persistGen = 0;
    private inFlightChecksums = 0;
    private static readonly MAX_INFLIGHT_CHECKSUMS = 50;
    private pendingChecksums = new Map<number, () => void>();
    private checksumSeq = 0;
    private _pendingPersistData: { events: RecordedEvent[]; sequence: number } | null = null;
    /** P1-15.4: debounce timer for coalescing high-frequency persistence bursts */
    private _persistTimer: ReturnType<typeof setTimeout> | null = null;
    private static readonly PERSIST_DEBOUNCE_MS = 1000;
    private static readonly WAL_TAIL_EVENTS = 300;
    private unsubCallbacks: Array<() => void> = [];
    /** P1-15.2: prevents new work after destroy() */
    private _destroyed = false;

    readonly checkpoints: CheckpointStore;
    private restoreHandler: ((checkpoint: Checkpoint) => boolean) | null = null;

    /** P1-15.1: serializes async event recording to preserve ordering */
    private _recordLock: Promise<void> | null = null;
    /** O-01: tracks the most recent recorded sequence for causal ordering */
    private _lastSeq = -1;

    private async _serializedRecord(fn: () => Promise<void>): Promise<void> {
        while (this._recordLock) {
            await this._recordLock;
        }
        let release: () => void;
        this._recordLock = new Promise((r) => {
            release = r;
        });
        try {
            await fn();
        } finally {
            this._recordLock = null;
            release!();
        }
    }

    private async boundedChecksum(
        event: string,
        data: unknown,
        timestamp: number,
    ): Promise<string> {
        if (this.inFlightChecksums >= EventRecorder.MAX_INFLIGHT_CHECKSUMS) {
            const seq = this.checksumSeq++;
            await new Promise<void>((resolve) => {
                this.pendingChecksums.set(seq, resolve);
            });
            // H-9: if clear()/destroy() resolved us, return empty checksum
            if (this._destroyed) return '';
        }
        this.inFlightChecksums++;
        try {
            const str = `${event}|${JSON.stringify(data ?? '')}|${timestamp}`;
            const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
            return Array.from(new Uint8Array(hash))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
                .slice(0, 32);
        } finally {
            this.inFlightChecksums--;
            const next = this.pendingChecksums.entries().next();
            if (!next.done) {
                const [k, v] = next.value;
                this.pendingChecksums.delete(k);
                v();
            }
        }
    }

    constructor(
        config?: Partial<RecorderConfig>,
        store?: EventRecorderStore,
        checkpointConfig?: Partial<CheckpointStoreConfig>,
        kv?: KvRepository,
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.store = store;

        this.checkpoints = new CheckpointStore(
            checkpointConfig,
            kv
                ? {
                      load: () => kv.get<Checkpoint[]>('event-sourcing:checkpoints'),
                      save: (checkpoints) => kv.set('event-sourcing:checkpoints', checkpoints),
                  }
                : undefined,
        );
    }

    async init(
        subscribeAll: (cb: (payload: { event: string; data: unknown }) => void) => () => void,
    ): Promise<void> {
        if (this.unsub) return;
        if (this.store) {
            await this.restore();
            // C-20: recover events lost from unflushed queueMicrotask on previous session
            const walKey = 'event-recorder:wal';
            try {
                const wal = ssrSafeStorage.getItem(walKey);
                if (wal) {
                    ssrSafeStorage.removeItem(walKey);
                    const recovered = safeJsonParse(wal) as {
                        events: RecordedEvent[];
                        sequence: number;
                    } | null;
                    if (
                        recovered &&
                        Array.isArray(recovered.events) &&
                        recovered.events.length > 0
                    ) {
                        const before = this.events.length;
                        for (const ev of recovered.events) {
                            if (!this.events.some((e) => e.sequence === ev.sequence)) {
                                this.events.push(ev);
                            }
                        }
                        this.sequence = Math.max(this.sequence, recovered.sequence);
                        this.events.sort((a, b) => a.sequence - b.sequence);
                        LOGGER.info(
                            'EventRecorder',
                            `Recovered ${this.events.length - before} events from WAL`,
                        );
                        await this.store.save({
                            events: [...this.events],
                            sequence: this.sequence,
                        });
                    }
                }
            } catch (e) {
                LOGGER.warn('EventRecorder', 'WAL recovery failed', { error: e });
            }
        }
        await this.checkpoints.init();

        // C-20: beforeunload WAL flush — synchronously persist pending events to localStorage
        const walKey = 'event-recorder:wal';
        const beforeUnloadHandler = () => {
            if (this._pendingPersistData) {
                try {
                    const walData = {
                        events: this._pendingPersistData.events.slice(
                            -EventRecorder.WAL_TAIL_EVENTS,
                        ),
                        sequence: this._pendingPersistData.sequence,
                    };
                    ssrSafeStorage.setItem(
                        walKey,
                        JSON.stringify(this.sanitizePayloadForWal(walData)),
                    );
                } catch {
                    // localStorage full — non-critical
                }
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', beforeUnloadHandler);
            this.unsubCallbacks.push(() =>
                window.removeEventListener('beforeunload', beforeUnloadHandler),
            );
        }

        this.unsub = subscribeAll(async (payload) => {
            if (!this.config.enabled || this._destroyed) return;
            if (isNoisyEvent(payload.event)) return;
            if (payload.event === 'cognitive:trace:updated') return;
            if (payload.event === 'cognitive:step:active') return;
            if (payload.event === 'cognitive:step:completed') return;
            if (payload.event === 'cognitive:decision:made') return;
            await this._serializedRecord(async () => {
                const ts = Date.now();
                const seq = this.sequence++;
                const recorded: RecordedEvent = {
                    sequence: seq,
                    event: payload.event,
                    data: payload.data,
                    timestamp: ts,
                    checksum: await this.boundedChecksum(payload.event, payload.data, ts),
                    prevSequence: this._lastSeq >= 0 ? this._lastSeq : undefined,
                };
                this._lastSeq = seq;
                if (this.config.filter && !this.config.filter(recorded)) return;
                this.events.push(recorded);
                if (this.events.length > this.config.maxEvents) {
                    this.events = this.events.slice(-this.config.maxEvents);
                }
                this.schedulePersist();
            });
        });
    }

    async record(event: string, data?: unknown): Promise<void> {
        if (!this.config.enabled || this._destroyed) return;
        if (isNoisyEvent(event)) return;
        if (event === 'cognitive:trace:updated') return;
        if (event === 'cognitive:step:active') return;
        if (event === 'cognitive:step:completed') return;
        if (event === 'cognitive:decision:made') return;
        await this._serializedRecord(async () => {
            const ts = Date.now();
            const recorded: RecordedEvent = {
                sequence: this.sequence++,
                event,
                data,
                timestamp: ts,
                checksum: await this.boundedChecksum(event, data, ts),
                prevSequence: this._lastSeq >= 0 ? this._lastSeq : undefined,
            };
            this._lastSeq = recorded.sequence;
            if (this.config.filter && !this.config.filter(recorded)) return;
            this.events.push(recorded);
            if (this.events.length > this.config.maxEvents) {
                this.events = this.events.slice(-this.config.maxEvents);
            }
            this.schedulePersist();
        });
    }

    getAll(): RecordedEvent[] {
        return [...this.events];
    }

    getRange(from: number, to: number): RecordedEvent[] {
        return this.events.slice(from, to);
    }

    getSince(sequence: number): RecordedEvent[] {
        if (this.events.length > 0 && sequence < this.events[0]!.sequence) {
            LOGGER.warn(
                'EventRecorder',
                'getSince: requested sequence predates earliest available event',
                {
                    requested: sequence,
                    earliestAvailable: this.events[0]!.sequence,
                },
            );
            return [];
        }
        return this.events.filter((e) => e.sequence > sequence);
    }

    getByEvent(eventName: string): RecordedEvent[] {
        return this.events.filter((e) => e.event === eventName);
    }

    getByTimeRange(start: number, end: number): RecordedEvent[] {
        return this.events.filter((e) => e.timestamp >= start && e.timestamp <= end);
    }

    getCount(): number {
        return this.events.length;
    }

    getSequenceRange(): { first: number; last: number } {
        if (this.events.length === 0) return { first: -1, last: -1 };
        return {
            first: this.events[0]!.sequence,
            last: this.events[this.events.length - 1]!.sequence,
        };
    }

    search(query: string): RecordedEvent[] {
        const q = query.toLowerCase();
        return this.events.filter(
            (e) =>
                e.event.toLowerCase().includes(q) ||
                JSON.stringify(e.data).toLowerCase().includes(q),
        );
    }

    onRestore(cb: (checkpoint: Checkpoint) => boolean): void {
        this.restoreHandler = cb;
    }

    createCheckpoint(
        label: string,
        options?: { tags?: string[]; description?: string },
    ): Checkpoint {
        return this.checkpoints.create(label, this.getSequenceRange().last, {}, options);
    }

    restoreCheckpoint(checkpointId: string): boolean {
        const cp = this.checkpoints.get(checkpointId);
        if (!cp) return false;
        if (!this.restoreHandler) return false;
        return this.restoreHandler(cp);
    }

    restoreLatestCheckpoint(): boolean {
        const cp = this.checkpoints.getLatest();
        if (!cp) return false;
        return this.restoreCheckpoint(cp.id);
    }

    getEventsSinceCheckpoint(checkpointId: string): RecordedEvent[] {
        const cp = this.checkpoints.get(checkpointId);
        if (!cp) return [];
        return this.getSince(cp.sequence);
    }

    exportSession(): string {
        return JSON.stringify({
            events: this.exportLog(),
            checkpoints: this.checkpoints.exportCheckpoints(),
            exportedAt: Date.now(),
        });
    }

    async importSession(json: string): Promise<{ events: number; checkpoints: number }> {
        try {
            const data = safeJsonParse(json) as Record<string, unknown> | undefined;
            const events = await this.importLog(
                ((data as Record<string, unknown>)?.events as string) ?? '{}',
            );
            const checkpoints = this.checkpoints.importCheckpoints(
                ((data as Record<string, unknown>)?.checkpoints as string) ?? '{}',
            );
            return { events, checkpoints };
        } catch (e) {
            LOGGER.warn('EventRecorder', 'Import session failed', { error: e });
            return { events: 0, checkpoints: 0 };
        }
    }

    async clear(): Promise<void> {
        this.events = [];
        this.sequence = 0;
        this._lastSeq = -1;
        this._persistGen++; // P1-15.3: invalidate any queued timer/microtask
        if (this._persistTimer) {
            clearTimeout(this._persistTimer);
            this._persistTimer = null;
        }
        this._pendingPersistData = null;
        this.persistQueued = false;
        // H-9: resolve all pending checksum waiters — they can't complete after clear
        for (const [, resolve] of this.pendingChecksums) resolve();
        this.pendingChecksums.clear();
        this.inFlightChecksums = 0;
        this.checkpoints.clear();
        if (this.store) {
            try {
                await this.store.save({ events: [], sequence: 0 });
                await this.store.clearAll?.();
            } catch (e) {
                LOGGER.warn('EventRecorder', 'clear failed', { error: e });
            }
        }
    }

    updateConfig(partial: Partial<RecorderConfig>): void {
        this.config = { ...this.config, ...partial };
    }

    isEnabled(): boolean {
        return this.config.enabled;
    }

    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
    }

    exportLog(): string {
        return JSON.stringify({ events: this.events, sequence: this.sequence });
    }

    async importLog(json: string): Promise<number> {
        try {
            const data = safeJsonParse(json) as Record<string, unknown> | undefined;
            const imported: RecordedEvent[] =
                ((data as Record<string, unknown>)?.events as RecordedEvent[]) ?? [];
            const hex32 = /^[0-9a-f]{32}$/;
            let valid = 0;
            for (const ev of imported) {
                if (!ev.checksum || !hex32.test(ev.checksum)) {
                    LOGGER.warn('EventRecorder', 'Import skipping event with invalid checksum', {
                        event: ev.event,
                        seq: ev.sequence,
                    });
                    continue;
                }
                const expectedChecksum = await this.boundedChecksum(
                    ev.event,
                    ev.data,
                    ev.timestamp,
                );
                if (ev.checksum !== expectedChecksum) {
                    LOGGER.warn('EventRecorder', 'Import skipping event with checksum mismatch', {
                        event: ev.event,
                        seq: ev.sequence,
                    });
                    continue;
                }
                if (
                    !this.events.some(
                        (e) =>
                            e.sequence === ev.sequence &&
                            e.event === ev.event &&
                            e.checksum === ev.checksum,
                    )
                ) {
                    this.events.push(ev);
                    valid++;
                }
            }
            this.events.sort((a, b) => a.sequence - b.sequence);
            this.sequence = Math.max(
                this.sequence,
                ((data as Record<string, unknown>)?.sequence as number) ?? 0,
            );
            this.schedulePersist();
            return valid;
        } catch (e) {
            LOGGER.warn('EventRecorder', 'Import log failed', { error: e });
            return 0;
        }
    }

    destroy(): void {
        this._destroyed = true;
        this._pendingPersistData = null;
        if (this._persistTimer) {
            clearTimeout(this._persistTimer);
            this._persistTimer = null;
        }
        this.unsub?.();
        this.unsub = null;
        for (const cb of this.unsubCallbacks) cb();
        this.unsubCallbacks = [];
        // H-7: resolve all pending checksum waiters so they don't hang forever
        for (const [, resolve] of this.pendingChecksums) resolve();
        this.pendingChecksums.clear();
        this.events = [];
        this.sequence = 0;
        this.checkpoints.destroy();
    }

    private async restore(): Promise<void> {
        if (!this.store) return;
        try {
            const snapshot = await this.store.load();
            if (!snapshot) return;
            this.events = snapshot.events.slice(-this.config.maxEvents);
            this.sequence = Math.max(snapshot.sequence, this.getSequenceRange().last + 1, 0);
        } catch (e) {
            LOGGER.warn('EventRecorder', 'Failed to restore persisted log', { error: e });
        }
    }

    // SECURITY: Sanitize event payloads before WAL persistence to localStorage.
    // localStorage is accessible to any script on the same origin (XSS exposure).
    // We strip keys/secrets and truncate large content fields to minimize data leakage
    // if an attacker gains script execution in the browser context.
    private sanitizePayloadForWal(data: { events: RecordedEvent[]; sequence: number }): {
        events: RecordedEvent[];
        sequence: number;
    } {
        const SENSITIVE_KEYS =
            /(?:key|token|secret|password|api_?key|apiKey|credential|authorization)/i;
        const strip = (obj: unknown): unknown => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(strip);
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
                if (SENSITIVE_KEYS.test(k)) {
                    result[k] = '[REDACTED]';
                } else if (typeof v === 'string' && k === 'content' && v.length > 200) {
                    result[k] = v.slice(0, 100) + '…[truncated]';
                } else {
                    result[k] = strip(v);
                }
            }
            return result;
        };
        return {
            sequence: data.sequence,
            events: data.events.map((ev) => ({ ...ev, data: strip(ev.data) })),
        };
    }

    private schedulePersist(): void {
        if (!this.store || this.persistQueued || this._destroyed) return;
        this.persistQueued = true;
        const gen = this._persistGen;
        this._pendingPersistData = { events: [...this.events], sequence: this.sequence };
        // P1-15.4: Debounce persistence — coalesce bursts (LLM streaming emits
        // thousands of events/sec) into a single Dexie write + WAL flush instead
        // of a full-array JSON.stringify + bulkAdd per event. Previously every
        // event did O(events) work: JSON.stringify(up to 10k events) → WAL
        // localStorage.setItem → Dexie transaction. During debates this saturated
        // the event loop (LLM timeouts) and churned large transient strings
        // (heap to ~1.2GB). 1000ms debounce is a safe middle ground.
        if (this._persistTimer) clearTimeout(this._persistTimer);
        this._persistTimer = setTimeout(() => {
            this._persistTimer = null;
            this.persistQueued = false;
            // P1-15.3: discard if clear() was called while timer was pending
            if (gen !== this._persistGen) return;
            const data = this._pendingPersistData;
            this._pendingPersistData = null;
            if (!data) return;
            // Synchronous WAL write — survives tab close. Cap to the tail so a
            // large event array doesn't blow the localStorage quota or stringify cost.
            try {
                const walData = {
                    events: data.events.slice(-EventRecorder.WAL_TAIL_EVENTS),
                    sequence: data.sequence,
                };
                ssrSafeStorage.setItem(
                    'event-recorder:wal',
                    JSON.stringify(this.sanitizePayloadForWal(walData)),
                );
            } catch {
                // silently ignore — ssrSafeStorage.setItem can fail in restricted environments
            }
            this.store
                ?.save(data)
                .catch((e) => LOGGER.warn('EventRecorder', 'Failed to persist log', { error: e }));
        }, EventRecorder.PERSIST_DEBOUNCE_MS);
    }
}
