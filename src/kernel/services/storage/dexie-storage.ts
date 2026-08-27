import { z } from 'zod';
import { getDexieDb } from '../database-service';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

let _dexieStorageEventBus: IEventBus | null = null;

/** Inject the event bus (called once at bootstrap). */
export function setDexieStorageEventBus(bus: IEventBus): void {
    _dexieStorageEventBus = bus;
}

const LOGGER = rootLogger.child('DexieStorage');
import type {
    StorageLayer,
    KeyStore,
    DexieMemoryStore,
    TraceStore,
    SessionStore,
    ConfigStore,
    RolesStore,
    SkillsStore,
} from '../../contracts/storage/storage-layer';

import type {
    DebateStore,
    DebateSessionRecord,
    DebateVerdictRecord,
} from '../../contracts/storage/debate-store';
import type { ApiKey } from '../../types/metrics-types';
import type { MemoryEntry } from '../../types/memory-types';
import type { CognitiveTrace } from '../../types/domain-types';
import type { ChatSession } from '../../contracts/storage/session-store';
import type { Role } from '../../contracts/storage/roles-store';
import type { Skill } from '../../contracts/storage/skills-store';
import {
    ApiKeySchema,
    MemoryEntrySchema,
    CognitiveTraceSchema,
    ChatSessionSchema,
    RoleSchema,
    CognitiveSkillSchema,
} from '../../../types/schemas';
import { KeyValueSchema } from '../../types/schema-types';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

function validateJsonArray(payload: string, schema: z.ZodType<unknown>): unknown[] {
    let parsed: unknown;
    try {
        parsed = safeJsonParse(payload);
    } catch {
        throw new Error('Import failed: invalid JSON');
    }
    if (!Array.isArray(parsed)) throw new Error('Import failed: expected array');
    const result = z.array(schema).safeParse(parsed);
    if (!result.success) {
        const msg = result.error.issues[0]?.message ?? 'validation error';
        const path = result.error.issues[0]?.path?.join('.') ?? '';
        throw new Error(`Import failed: ${path ? path + ': ' : ''}${msg}`);
    }
    return result.data;
}

class DexieKeyStore implements KeyStore {
    async saveKey(key: ApiKey): Promise<void> {
        await getDexieDb().apiKeys.put(key);
    }

    async getKey(id: string): Promise<ApiKey | null> {
        return (await getDexieDb().apiKeys.get(id)) ?? null;
    }

    async listKeys(): Promise<ApiKey[]> {
        return getDexieDb().apiKeys.toArray();
    }

    async deleteKey(id: string): Promise<void> {
        await getDexieDb().apiKeys.delete(id);
    }

    async bulkPut(keys: ApiKey[]): Promise<void> {
        await getDexieDb().apiKeys.bulkPut(keys);
    }

    async bulkAdd(keys: ApiKey[]): Promise<void> {
        await this.bulkPut(keys);
    }

    async where(field: 'id' | 'provider' | 'status', value: string): Promise<ApiKey | undefined> {
        return getDexieDb().apiKeys.where(field).equals(value).first();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().apiKeys.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, ApiKeySchema) as ApiKey[];
        await getDexieDb().transaction('rw', getDexieDb().apiKeys, async () => {
            await getDexieDb().apiKeys.clear();
            if (data.length > 0) await getDexieDb().apiKeys.bulkPut(data);
        });
    }

    async clear(): Promise<void> {
        await getDexieDb().apiKeys.clear();
    }
}

class DexieMemoryStoreImpl implements DexieMemoryStore {
    async saveEntry(entry: MemoryEntry): Promise<void> {
        await getDexieDb().memories.put(entry);
    }

    async getEntry(id: string): Promise<MemoryEntry | null> {
        return (await getDexieDb().memories.get(id)) ?? null;
    }

    async queryEntries(options: {
        type?: string;
        before?: number;
        after?: number;
        limit?: number;
        order?: 'asc' | 'desc';
    }): Promise<MemoryEntry[]> {
        const db = getDexieDb();
        let collection:
            ReturnType<typeof db.memories.where> | ReturnType<typeof db.memories.orderBy>;

        if (options.type) {
            collection = db.memories.where('[metadata.type]').equals(options.type);
        } else if (options.before) {
            // Compound index `[metadata.timestamp]` requires an array bound —
            // a scalar `.below(x)` compares a number against array keys and matches nothing.
            collection = db.memories.where('[metadata.timestamp]').below([options.before]);
        } else if (options.after) {
            collection = db.memories.where('[metadata.timestamp]').above([options.after]);
        } else {
            collection = db.memories.orderBy('id');
        }

        if (options.order === 'desc' && 'reverse' in collection) {
            collection = (collection as ReturnType<typeof db.memories.orderBy>).reverse();
        }

        let arr = await collection.toArray();

        if (options.type && !arr.every((e) => e.metadata?.type === options.type)) {
            arr = arr.filter((e) => e.metadata?.type === options.type);
        }
        const beforeTs = options.before;
        const afterTs = options.after;
        if (beforeTs) {
            arr = arr.filter((e) => (e.metadata?.timestamp ?? 0) < beforeTs);
        }
        if (afterTs) {
            arr = arr.filter((e) => (e.metadata?.timestamp ?? 0) > afterTs);
        }
        if (options.order === 'desc') arr.reverse();
        if (options.limit && arr.length > options.limit) {
            arr = arr.slice(0, options.limit);
        }
        return arr;
    }

    async deleteEntry(id: string): Promise<void> {
        await getDexieDb().memories.delete(id);
    }

    async updateEntry(id: string, updates: Partial<MemoryEntry>): Promise<void> {
        await getDexieDb().memories.update(id, updates);
    }

    async count(): Promise<number> {
        return getDexieDb().memories.count();
    }

    async bulkAdd(entries: MemoryEntry[]): Promise<void> {
        await getDexieDb().memories.bulkPut(entries);
    }

    async clear(): Promise<void> {
        await getDexieDb().memories.clear();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().memories.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, MemoryEntrySchema) as MemoryEntry[];
        await getDexieDb().transaction('rw', getDexieDb().memories, async () => {
            await getDexieDb().memories.clear();
            if (data.length > 0) await getDexieDb().memories.bulkPut(data);
        });
    }

    async deleteBefore(timestamp: number): Promise<void> {
        await getDexieDb()
            .memories.filter((e) => (e.metadata?.timestamp ?? 0) < timestamp)
            .delete();
    }
}

class DexieTraceStore implements TraceStore {
    async saveTrace(trace: CognitiveTrace): Promise<void> {
        await getDexieDb().cognitiveTraces.put(trace);
    }

    async getTrace(id: string): Promise<CognitiveTrace | null> {
        return (await getDexieDb().cognitiveTraces.get(id)) ?? null;
    }

    async queryTraces(options: {
        type?: string;
        status?: string;
        before?: number;
        after?: number;
        limit?: number;
        order?: 'asc' | 'desc';
        provider?: string;
    }): Promise<CognitiveTrace[]> {
        let collection = getDexieDb().cognitiveTraces.orderBy('startTime');
        if (options.status) collection = collection.filter((t) => t.status === options.status!);
        if (options.after) collection = collection.filter((t) => t.startTime >= options.after!);
        if (options.before) collection = collection.filter((t) => t.startTime <= options.before!);
        if (options.order === 'desc') collection = collection.reverse();
        if (options.limit) collection = collection.limit(options.limit);
        return collection.toArray();
    }

    async deleteTrace(id: string): Promise<void> {
        await getDexieDb().cognitiveTraces.delete(id);
    }

    async count(): Promise<number> {
        return getDexieDb().cognitiveTraces.count();
    }

    async bulkPut(traces: CognitiveTrace[]): Promise<void> {
        await getDexieDb().cognitiveTraces.bulkPut(traces);
    }

    async clear(): Promise<void> {
        await getDexieDb().cognitiveTraces.clear();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().cognitiveTraces.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, CognitiveTraceSchema) as CognitiveTrace[];
        await getDexieDb().transaction('rw', getDexieDb().cognitiveTraces, async () => {
            await getDexieDb().cognitiveTraces.clear();
            if (data.length > 0) await getDexieDb().cognitiveTraces.bulkPut(data);
        });
    }
}

class DexieSessionStore implements SessionStore {
    async saveSession(session: ChatSession): Promise<void> {
        await this.put(session);
    }

    async put(session: ChatSession): Promise<void> {
        const db = getDexieDb();
        await db.transaction('rw', db.sessions, async () => {
            const current = await db.sessions.get(session.id);
            const currentVersion = (current as { version?: number })?.version ?? 0;
            const incomingVersion = (session as { version?: number })?.version ?? 0;
            if (incomingVersion > 0 && incomingVersion < currentVersion) return;
            const newVersion = Math.max(currentVersion, incomingVersion) + 1;
            await db.sessions.put({ ...session, version: newVersion });
        });
    }

    async getSession(id: string): Promise<ChatSession | null> {
        return (await getDexieDb().sessions.get(id)) ?? null;
    }

    async listSessions(limit = 50, offset = 0): Promise<ChatSession[]> {
        return getDexieDb()
            .sessions.orderBy('updatedAt')
            .reverse()
            .offset(offset)
            .limit(limit)
            .toArray();
    }

    async listAll(): Promise<ChatSession[]> {
        return getDexieDb().sessions.toArray();
    }

    async deleteSession(id: string): Promise<void> {
        await getDexieDb().sessions.delete(id);
    }

    async updateSession(id: string, changes: Partial<ChatSession>): Promise<void> {
        const db = getDexieDb();
        await db.transaction('rw', db.sessions, async () => {
            const current = await db.sessions.get(id);
            const currentVersion = (current as { version?: number })?.version ?? 0;
            const newVersion = currentVersion + 1;
            await db.sessions.update(id, { ...changes, version: newVersion });
        });
    }

    async bulkPut(sessions: ChatSession[]): Promise<void> {
        const db = getDexieDb();
        await db.transaction('rw', db.sessions, async () => {
            for (const session of sessions) {
                const current = await db.sessions.get(session.id);
                const currentVersion = (current as { version?: number })?.version ?? 0;
                const incomingVersion = (session as { version?: number })?.version ?? 0;
                if (incomingVersion > 0 && incomingVersion < currentVersion) continue;
                const newVersion = Math.max(currentVersion, incomingVersion) + 1;
                await db.sessions.put({ ...session, version: newVersion });
            }
        });
    }

    async bulkDelete(ids: string[]): Promise<void> {
        await getDexieDb().sessions.bulkDelete(ids);
    }

    async syncSessions(sessions: ChatSession[], deletedIds: string[]): Promise<void> {
        const db = getDexieDb();
        await db.transaction('rw', db.sessions, async () => {
            for (const session of sessions) {
                const current = await db.sessions.get(session.id);
                const currentVersion = (current as { version?: number })?.version ?? 0;
                const incomingVersion = (session as { version?: number })?.version ?? 0;
                if (incomingVersion > 0 && incomingVersion < currentVersion) continue;
                const newVersion = Math.max(currentVersion, incomingVersion) + 1;
                await db.sessions.put({ ...session, version: newVersion });
            }
            if (deletedIds.length > 0) await db.sessions.bulkDelete(deletedIds);
        });
    }

    async count(): Promise<number> {
        return getDexieDb().sessions.count();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().sessions.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, ChatSessionSchema) as ChatSession[];
        await getDexieDb().transaction('rw', getDexieDb().sessions, async () => {
            await getDexieDb().sessions.clear();
            if (data.length > 0) await getDexieDb().sessions.bulkPut(data);
        });
    }

    async clear(): Promise<void> {
        await getDexieDb().sessions.clear();
    }
}

class DexieRolesStore implements RolesStore {
    async loadAll(): Promise<Role[]> {
        return getDexieDb().roles.toArray();
    }

    async saveAll(roles: Role[]): Promise<void> {
        await getDexieDb().transaction('rw', getDexieDb().roles, async () => {
            await getDexieDb().roles.clear();
            if (roles.length > 0) await getDexieDb().roles.bulkPut(roles);
        });
    }

    async toArray(): Promise<Role[]> {
        return getDexieDb().roles.toArray();
    }

    async bulkAdd(roles: Role[]): Promise<void> {
        await getDexieDb().roles.bulkPut(roles);
    }

    async bulkPut(roles: Role[]): Promise<void> {
        await getDexieDb().roles.bulkPut(roles);
    }

    async count(): Promise<number> {
        return getDexieDb().roles.count();
    }

    async clear(): Promise<void> {
        await getDexieDb().roles.clear();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().roles.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, RoleSchema) as Role[];
        await getDexieDb().transaction('rw', getDexieDb().roles, async () => {
            await getDexieDb().roles.clear();
            if (data.length > 0) await getDexieDb().roles.bulkPut(data);
        });
    }
}

class DexieSkillsStore implements SkillsStore {
    async loadAll(): Promise<Skill[]> {
        return getDexieDb().skills.toArray();
    }

    async saveAll(skills: Skill[]): Promise<void> {
        await getDexieDb().transaction('rw', getDexieDb().skills, async () => {
            await getDexieDb().skills.clear();
            if (skills.length > 0) await getDexieDb().skills.bulkPut(skills);
        });
    }

    async toArray(): Promise<Skill[]> {
        return getDexieDb().skills.toArray();
    }

    async bulkAdd(skills: Skill[]): Promise<void> {
        await getDexieDb().skills.bulkPut(skills);
    }

    async bulkPut(skills: Skill[]): Promise<void> {
        await getDexieDb().skills.bulkPut(skills);
    }

    async count(): Promise<number> {
        return getDexieDb().skills.count();
    }

    async clear(): Promise<void> {
        await getDexieDb().skills.clear();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().skills.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, CognitiveSkillSchema) as Skill[];
        await getDexieDb().transaction('rw', getDexieDb().skills, async () => {
            await getDexieDb().skills.clear();
            if (data.length > 0) await getDexieDb().skills.bulkPut(data);
        });
    }
}

class DexieConfigStore implements ConfigStore {
    async get<T>(key: string): Promise<T | null> {
        const record = await getDexieDb().keyValue.get(key);
        return record ? (record.value as T) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await getDexieDb().transaction('rw', getDexieDb().keyValue, async () => {
            const existing = await getDexieDb().keyValue.get(key);
            await getDexieDb().keyValue.put({
                id: key,
                value,
                createdAt: existing?.createdAt ?? Date.now(),
            });
        });
    }

    async delete(key: string): Promise<void> {
        await getDexieDb().keyValue.delete(key);
    }

    async clear(): Promise<void> {
        await getDexieDb().keyValue.clear();
    }

    async exportAll(): Promise<string> {
        return JSON.stringify(await getDexieDb().keyValue.toArray());
    }

    async importAll(payload: string): Promise<void> {
        const data = validateJsonArray(payload, KeyValueSchema) as {
            id: string;
            value: unknown;
            createdAt?: number;
        }[];
        await getDexieDb().transaction('rw', getDexieDb().keyValue, async () => {
            await getDexieDb().keyValue.clear();
            if (data.length > 0) await getDexieDb().keyValue.bulkPut(data);
        });
    }
}

class DexieDebateStore implements DebateStore {
    async saveSnapshot(record: DebateSessionRecord): Promise<number> {
        return getDexieDb().transaction('rw', getDexieDb().debateSessions, async () => {
            const current = await getDexieDb().debateSessions.get(record.id);
            const currentVersion = (current as { version?: number })?.version ?? 0;
            if (current && record.version != null && record.version < currentVersion) {
                LOGGER.error('DexieStorage', 'version conflict', {
                    id: record.id,
                    db: currentVersion,
                    attempted: record.version,
                });
                _dexieStorageEventBus?.emit(EVENTS.DEBATE_SESSION_CONFLICT, {
                    sessionId: record.id,
                    currentVersion,
                    attemptedVersion: record.version,
                });
                throw new Error(
                    `Debate session ${record.id} version conflict: DB has ${currentVersion}, attempted ${record.version}. Reload the page to get the latest version.`,
                );
            }
            const newVersion = currentVersion + 1;
            await getDexieDb().debateSessions.put({ ...record, version: newVersion });
            return newVersion;
        });
    }

    async getSnapshot(id: string): Promise<DebateSessionRecord | null> {
        const raw = await getDexieDb().debateSessions.get(id);
        return raw ?? null;
    }

    async listSessions(options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<DebateSessionRecord[]> {
        const collection = getDexieDb().debateSessions.orderBy('updatedAt').reverse();
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;
        let records: DebateSessionRecord[];
        if (options?.status) {
            records = await collection
                .filter((r) => r.phase === options.status)
                .offset(offset)
                .limit(limit)
                .toArray();
        } else {
            records = await collection.offset(offset).limit(limit).toArray();
        }
        return records;
    }

    async listAllSessions(): Promise<DebateSessionRecord[]> {
        return getDexieDb().debateSessions.toArray();
    }

    async deleteSession(id: string): Promise<void> {
        await getDexieDb().debateSessions.delete(id);
    }

    async saveVerdict(record: DebateVerdictRecord): Promise<void> {
        await getDexieDb().debateVerdicts.put(record);
    }

    async getVerdict(sessionId: string): Promise<DebateVerdictRecord | null> {
        const raw = await getDexieDb().debateVerdicts.get(sessionId);
        return raw ?? null;
    }

    async count(): Promise<number> {
        return getDexieDb().debateSessions.count();
    }
}

let _instance: StorageLayer | null = null;

export function createDexieStorage(): StorageLayer {
    if (!_instance) {
        _instance = {
            keys: new DexieKeyStore(),
            memory: new DexieMemoryStoreImpl(),
            traces: new DexieTraceStore(),
            sessions: new DexieSessionStore(),
            config: new DexieConfigStore(),
            roles: new DexieRolesStore(),
            skills: new DexieSkillsStore(),
            debates: new DexieDebateStore(),
        };
    }
    return _instance!;
}

export function resetDexieStorage(): void {
    _instance = null;
}
