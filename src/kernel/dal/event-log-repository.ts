import type { DatabaseService } from '../services/database-service';
import type { RecordedEventRow } from '../services/dexie-schema';
import type { EventRecorderStore, RecordedEvent } from '../services/event-sourcing/event-recorder';
import { rootLogger } from '../services/logger-service';
import { safeJsonParse } from '../utils/safe-json';

const LOGGER = rootLogger.child('EventLogRepository');

const SEQ_STORAGE_KEY = 'event_log_last_persisted_seq';

export class EventLogRepository implements EventRecorderStore {
    private db: DatabaseService;
    private lastPersistedSeq = -1;
    private maxEvents: number;

    constructor(db: DatabaseService, maxEvents = 1000) {
        this.db = db;
        this.maxEvents = maxEvents;
    }

    private async loadPersistedSeq(): Promise<void> {
        try {
            const record = await this.db.getKv<number>(SEQ_STORAGE_KEY);
            if (record !== null && typeof record === 'number' && record >= 0) {
                this.lastPersistedSeq = record;
            }
        } catch {
            // Non-critical — will recover from eventLog table
        }
    }

    private async persistSeq(): Promise<void> {
        try {
            await this.db.setKv(SEQ_STORAGE_KEY, this.lastPersistedSeq);
        } catch {
            // Non-critical — sequence will be recovered on next load
        }
    }

    async load(): Promise<{ events: RecordedEvent[]; sequence: number } | null> {
        try {
            await this.loadPersistedSeq();
            const total = await this.db.eventLog.count();
            if (total === 0) return { events: [], sequence: this.lastPersistedSeq + 1 };
            const keep = Math.min(total, this.maxEvents);
            const rows = await this.db.eventLog.orderBy('sequence').reverse().limit(keep).toArray();
            rows.reverse();

            const seq = rows[rows.length - 1]!.sequence;
            if (seq > this.lastPersistedSeq) this.lastPersistedSeq = seq;
            const events: RecordedEvent[] = rows.map((row) => ({
                sequence: row.sequence,
                event: row.event,
                data: safeJsonParse(row.dataJson, {}),
                timestamp: row.timestamp,
                checksum: row.checksum,
            }));
            return { events, sequence: seq + 1 };
        } catch (e) {
            LOGGER.warn('EventLogRepository', 'Load failed', { error: e });
            return null;
        }
    }

    async save(snapshot: { events: RecordedEvent[]; sequence: number }): Promise<void> {
        try {
            await this.db.eventLog.db.transaction('rw', [this.db.eventLog], async () => {
                const toInsert: RecordedEventRow[] = [];
                for (const ev of snapshot.events) {
                    if (ev.sequence > this.lastPersistedSeq) {
                        toInsert.push({
                            sequence: ev.sequence,
                            event: ev.event,
                            dataJson: JSON.stringify(ev.data),
                            checksum: ev.checksum,
                            timestamp: ev.timestamp,
                        });
                    }
                }

                if (toInsert.length > 0) {
                    await this.db.eventLog.bulkAdd(toInsert);
                    this.lastPersistedSeq = Math.max(
                        this.lastPersistedSeq,
                        ...toInsert.map((r) => r.sequence),
                    );
                }

                const totalCount = await this.db.eventLog.count();
                if (totalCount > this.maxEvents) {
                    const excess = totalCount - this.maxEvents;
                    const oldest = await this.db.eventLog.orderBy('id').limit(excess).toArray();
                    const oldestIds = oldest.map((r) => r.id!);
                    await this.db.eventLog.bulkDelete(oldestIds);
                }
            });
            await this.persistSeq();
        } catch (e) {
            LOGGER.warn('EventLogRepository', 'Save failed', { error: e });
        }
    }

    async clearAll(): Promise<void> {
        await this.db.eventLog.clear();
        this.lastPersistedSeq = -1;
        try {
            await this.db.setKv(SEQ_STORAGE_KEY, -1);
        } catch {
            // Non-critical
        }
    }
}
