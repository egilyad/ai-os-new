import { z } from 'zod';
import type { Table } from 'dexie';
import type { Connector } from '../types/domain-types';
import type { ConversationScenario } from '../contracts/conversation';
import type { ConversationSession } from '../contracts/conversation/session';
import type {
    InvocationRecord,
    InvocationPolicyRecord,
    InvocationCostRecord,
} from '../types/invocation-types';
import type { IDatabaseService } from '../types/interfaces';
import { REDACTED_MARKER, SuperAgentsDB } from './dexie-schema';
import { rootLogger } from './logger-service';
import { ssrSafeStorage } from '../utils/ssr-storage';
import {
    MemoryEntrySchema,
    ApiKeySchema,
    ChatSessionSchema,
    KeyNoteSchema,
    RoleSchema,
    CognitiveTraceSchema,
    ExecutionTraceSchema,
    CognitiveSkillSchema,
    ConnectorSchema,
    KeyValueSchema,
} from '../../types/schemas';
import {
    DebateSessionRecordSchema,
    DebateVerdictRecordSchema,
    DebateTimelineEntrySchema,
    DebateOverrideSchema,
    SessionLinkSchema,
    EventLogEntrySchema,
} from '../types/schema-types';

const LOGGER = rootLogger.child('DatabaseService');

let _dexieDb: SuperAgentsDB | null = null;

function isBrowser(): boolean {
    try {
        return typeof indexedDB !== 'undefined';
    } catch {
        return false;
    }
}

export function getDexieDb(): SuperAgentsDB {
    if (!_dexieDb) {
        if (!isBrowser()) throw new Error('Dexie requires browser environment with IndexedDB');
        _dexieDb = new SuperAgentsDB();
        import('./dexie-identity')
            .then((mod) => {
                void mod.anchorDexieInstance('database-service:singleton', _dexieDb!);
            })
            .catch((e) => {
                LOGGER.warn('DatabaseService', 'failed to anchor dexie singleton', { error: e });
            });
    }
    return _dexieDb;
}

export interface IntegrityReport {
    table: string;
    total: number;
    valid: number;
    invalid: number;
    sampleErrors: string[];
}

const TABLE_SCHEMA_MAP: Record<string, z.ZodType<unknown>> = {
    notes: KeyNoteSchema,
    memories: MemoryEntrySchema,
    apiKeys: ApiKeySchema,
    sessions: ChatSessionSchema,
    roles: RoleSchema,
    cognitiveTraces: CognitiveTraceSchema,
    traces: ExecutionTraceSchema,
    skills: CognitiveSkillSchema,
    connectors: ConnectorSchema,
    keyValue: KeyValueSchema,
    debateSessions: DebateSessionRecordSchema,
    debateVerdicts: DebateVerdictRecordSchema,
    debateTimeline: DebateTimelineEntrySchema,
    debateOverrides: DebateOverrideSchema,
    sessionLinks: SessionLinkSchema,
    eventLog: EventLogEntrySchema,
};

const DEFAULT_INTEGRITY_SCAN_MS = 30 * 60 * 1000;

export class DatabaseService implements IDatabaseService {
    private _integrityTimer: ReturnType<typeof setInterval> | null = null;
    /** C-02: localStorage flag set on clean shutdown, cleared on startup — if found missing, crash detected */
    private static readonly CLEAN_SHUTDOWN_KEY = 'ai_os_clean_shutdown';

    private async cleanupStaleLocks(): Promise<void> {
        try {
            const dexie = getDexieDb();
            const all = await dexie.keyValue.toArray();
            const stale: string[] = [];
            const now = Date.now();
            for (const entry of all) {
                if (typeof entry.id === 'string' && entry.id.startsWith('distlock:')) {
                    const val = entry.value as Record<string, unknown> | null;
                    const ttl = typeof val?.ttl === 'number' ? val.ttl : 30000;
                    const heartbeatAt = typeof val?.heartbeatAt === 'number' ? val.heartbeatAt : 0;
                    if (now - heartbeatAt > ttl * 2) {
                        stale.push(entry.id);
                    }
                }
            }
            if (stale.length > 0) {
                await dexie.keyValue.bulkDelete(stale);
                LOGGER.info(
                    'DatabaseService',
                    `Cleaned ${stale.length} stale distributed lock(s) after crash`,
                    {
                        stale,
                    },
                );
            }
        } catch (e) {
            LOGGER.warn('DatabaseService', 'Failed to clean stale distributed locks', { error: e });
        }
    }

    init(config?: { integrityScanIntervalMs?: number }): void {
        if (this._integrityTimer) return;
        const intervalMs = config?.integrityScanIntervalMs ?? DEFAULT_INTEGRITY_SCAN_MS;
        // C-02: detect unclean shutdown — clean_shutdown flag should NOT exist at startup (destroy sets it)
        const cleanShutdown = ssrSafeStorage.getItem(DatabaseService.CLEAN_SHUTDOWN_KEY);
        if (cleanShutdown === null) {
            LOGGER.info(
                'DatabaseService',
                'No clean shutdown flag — possible crash, running integrity scan',
            );
        }
        // C-02: clear the flag so next crash detection works
        try {
            ssrSafeStorage.removeItem(DatabaseService.CLEAN_SHUTDOWN_KEY);
        } catch {
            // ignore — ssrSafeStorage may not be available
        }
        // C-01: clean stale distributed locks from crashed tabs
        this.cleanupStaleLocks().catch((e) => {
            LOGGER.warn('DatabaseService', 'Stale lock cleanup failed', { error: e });
        });
        // C-01: run initial integrity scan immediately to detect crash-induced corruption
        this.verifyIntegrity()
            .then((reports) => {
                const corrupt = reports.filter((r) => r.invalid > 0);
                if (corrupt.length > 0) {
                    LOGGER.warn(
                        'DatabaseService',
                        `Startup integrity scan: ${corrupt.length} table(s) have corrupt data (${corrupt.reduce((s, r) => s + r.invalid, 0)} invalid rows total)`,
                        {
                            details: corrupt.map((r) => ({
                                table: r.table,
                                invalid: r.invalid,
                                total: r.total,
                                sampleErrors: r.sampleErrors,
                            })),
                        },
                    );
                } else {
                    LOGGER.info('DatabaseService', 'Startup integrity scan: all tables clean');
                }
            })
            .catch((e) => {
                LOGGER.error('DatabaseService', 'Startup integrity scan failed', {
                    error: String(e),
                });
            });
        this._integrityTimer = setInterval(() => {
            this.verifyIntegrity()
                .then((reports) => {
                    const corrupt = reports.filter((r) => r.invalid > 0);
                    if (corrupt.length > 0) {
                        LOGGER.warn(
                            'DatabaseService',
                            `Integrity scan detected corruption in ${corrupt.length} table(s)`,
                            {
                                details: corrupt.map((r) => ({
                                    table: r.table,
                                    invalid: r.invalid,
                                    total: r.total,
                                    sampleErrors: r.sampleErrors,
                                })),
                            },
                        );
                    }
                })
                .catch((e) => {
                    LOGGER.error('DatabaseService', 'Integrity scan failed', { error: String(e) });
                });
        }, intervalMs);
        LOGGER.info('DatabaseService', 'Integrity auto-scan started', {
            intervalMs,
        });
    }

    destroy(): void {
        if (this._integrityTimer) {
            clearInterval(this._integrityTimer);
            this._integrityTimer = null;
        }
    }
    get apiKeys() {
        return getDexieDb().apiKeys;
    }
    get notes() {
        return getDexieDb().notes;
    }
    get memories() {
        return getDexieDb().memories;
    }
    get sessions() {
        return getDexieDb().sessions;
    }
    get roles() {
        return getDexieDb().roles;
    }
    get cognitiveTraces() {
        return getDexieDb().cognitiveTraces;
    }
    get traces() {
        return getDexieDb().traces;
    }
    get skills() {
        return getDexieDb().skills;
    }
    get connectors() {
        return getDexieDb().connectors;
    }
    get keyValue() {
        return getDexieDb().keyValue;
    }
    get debateSessions() {
        return getDexieDb().debateSessions;
    }
    get debateVerdicts() {
        return getDexieDb().debateVerdicts;
    }
    get debateTimeline() {
        return getDexieDb().debateTimeline;
    }
    get debateOverrides() {
        return getDexieDb().debateOverrides;
    }
    get sessionLinks() {
        return getDexieDb().sessionLinks;
    }
    get eventLog() {
        return getDexieDb().eventLog;
    }
    get crystals() {
        return getDexieDb().crystals;
    }
    get crystalVersions() {
        return getDexieDb().crystalVersions;
    }
    get junctions() {
        return getDexieDb().junctions;
    }
    get synthSessions() {
        return getDexieDb().synthSessions;
    }
    get synthPerspectives() {
        return getDexieDb().synthPerspectives;
    }
    get genJobs() {
        return getDexieDb().genJobs;
    }
    get forumTopics() {
        return getDexieDb().forumTopics;
    }
    get forumPosts() {
        return getDexieDb().forumPosts;
    }
    get forumVotes() {
        return getDexieDb().forumVotes;
    }
    get forumSubs() {
        return getDexieDb().forumSubs;
    }
    get workflows() {
        return getDexieDb().workflows;
    }
    get scenarios(): Table<ConversationScenario> {
        return getDexieDb().scenarios;
    }
    get invocations(): Table<InvocationRecord> {
        return getDexieDb().invocations;
    }
    get invocationPolicies(): Table<InvocationPolicyRecord> {
        return getDexieDb().invocationPolicies;
    }
    get invocationCosts(): Table<InvocationCostRecord> {
        return getDexieDb().invocationCosts;
    }
    get directorSessions(): Table<ConversationSession> {
        return getDexieDb().directorSessions;
    }
    get db() {
        return getDexieDb();
    }

    async getKv<T>(id: string): Promise<T | null> {
        const record = await getDexieDb().keyValue.get(id);
        if (!record) return null;
        return record.value as T;
    }

    async getKvCas<T>(id: string): Promise<{ value: T | null; version: number }> {
        const record = await getDexieDb().keyValue.get(id);
        if (!record) return { value: null, version: 0 };
        return { value: record.value as T, version: record.version ?? 0 };
    }

    async setKv<T>(id: string, value: T): Promise<void> {
        const dexie = getDexieDb();
        await dexie.transaction('rw', dexie.keyValue, async () => {
            const existing = await dexie.keyValue.get(id);
            await dexie.keyValue.put({
                id,
                value,
                createdAt: existing?.createdAt ?? Date.now(),
                version: (existing?.version ?? 0) + 1,
            });
        });
    }

    async setKvCas<T>(id: string, value: T, expectedVersion: number): Promise<boolean> {
        const dexie = getDexieDb();
        try {
            await dexie.transaction('rw', dexie.keyValue, async () => {
                const existing = await dexie.keyValue.get(id);
                const currentVersion = existing?.version ?? 0;
                if (currentVersion !== expectedVersion) {
                    throw new Error('Version conflict');
                }
                await dexie.keyValue.put({
                    id,
                    value,
                    createdAt: existing?.createdAt ?? Date.now(),
                    version: currentVersion + 1,
                });
            });
            return true;
        } catch {
            return false;
        }
    }

    async batchSetKv(entries: Record<string, unknown>): Promise<void> {
        const dexie = getDexieDb();
        await dexie.transaction('rw', dexie.keyValue, async () => {
            const now = Date.now();
            for (const [id, value] of Object.entries(entries)) {
                const existing = await dexie.keyValue.get(id);
                await dexie.keyValue.put({
                    id,
                    value,
                    createdAt: existing?.createdAt ?? now,
                    version: (existing?.version ?? 0) + 1,
                });
            }
        });
    }

    async batchSetKvCas(
        entries: Record<string, unknown>,
        expectedVersions: Record<string, number>,
    ): Promise<boolean> {
        const dexie = getDexieDb();
        try {
            await dexie.transaction('rw', dexie.keyValue, async () => {
                for (const [id, value] of Object.entries(entries)) {
                    const existing = await dexie.keyValue.get(id);
                    const currentVersion = existing?.version ?? 0;
                    const expected = expectedVersions[id] ?? 0;
                    if (currentVersion !== expected) throw new Error('Version conflict');
                    await dexie.keyValue.put({
                        id,
                        value,
                        createdAt: existing?.createdAt ?? Date.now(),
                        version: currentVersion + 1,
                    });
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    async bulkPutConnectors(connectors: Connector[]): Promise<void> {
        await getDexieDb().connectors.bulkPut(connectors);
    }

    async getAllConnectors(): Promise<Connector[]> {
        return getDexieDb().connectors.toArray();
    }

    async saveWorkflow(topology: unknown): Promise<void> {
        await getDexieDb().keyValue.put({
            id: 'saved_workflow',
            value: topology,
            createdAt: Date.now(),
        });
    }

    async exportToJson(includeSecrets = false): Promise<Record<string, unknown[]>> {
        const [
            notes,
            memories,
            apiKeys,
            sessions,
            roles,
            cognitiveTraces,
            traces,
            skills,
            connectors,
            keyValue,
            debateSessions,
            debateVerdicts,
            debateTimeline,
            debateOverrides,
            sessionLinks,
            eventLog,
        ] = await Promise.all([
            getDexieDb().notes.toArray(),
            getDexieDb().memories.toArray(),
            getDexieDb().apiKeys.toArray(),
            getDexieDb().sessions.toArray(),
            getDexieDb().roles.toArray(),
            getDexieDb().cognitiveTraces.toArray(),
            getDexieDb().traces.toArray(),
            getDexieDb().skills.toArray(),
            getDexieDb().connectors.toArray(),
            getDexieDb().keyValue.toArray(),
            getDexieDb().debateSessions.toArray(),
            getDexieDb().debateVerdicts.toArray(),
            getDexieDb().debateTimeline.toArray(),
            getDexieDb().debateOverrides.toArray(),
            getDexieDb().sessionLinks.toArray(),
            getDexieDb().eventLog.toArray(),
        ]);
        const exportedKeys = includeSecrets
            ? apiKeys
            : apiKeys.map((k) => ({
                  ...k,
                  key: REDACTED_MARKER,
              }));
        return {
            notes,
            memories,
            apiKeys: exportedKeys,
            sessions,
            roles,
            cognitiveTraces,
            traces,
            skills,
            connectors,
            keyValue,
            debateSessions,
            debateVerdicts,
            debateTimeline,
            debateOverrides,
            sessionLinks,
            eventLog,
        };
    }

    async verifyIntegrity(): Promise<IntegrityReport[]> {
        const reports: IntegrityReport[] = [];
        const dexie = getDexieDb();
        for (const [tableName, schema] of Object.entries(TABLE_SCHEMA_MAP)) {
            const rows = await (
                dexie as unknown as Record<string, { toArray(): Promise<unknown[]> }>
            )[tableName]!.toArray();
            const errors: string[] = [];
            let valid = 0;
            for (const row of rows) {
                const r = schema.safeParse(row);
                if (r.success) {
                    valid++;
                } else {
                    if (errors.length < 5) {
                        const id = (row as Record<string, unknown>)?.id ?? '(no id)';
                        errors.push(`[${id}] ${r.error.issues[0]?.message ?? 'unknown'}`);
                    }
                }
            }
            reports.push({
                table: tableName,
                total: rows.length,
                valid,
                invalid: rows.length - valid,
                sampleErrors: errors,
            });
        }
        return reports;
    }

    async importFromJson(data: Record<string, unknown[]>): Promise<void> {
        const tableMap: Record<string, Table> = {
            notes: getDexieDb().notes,
            memories: getDexieDb().memories,
            apiKeys: getDexieDb().apiKeys,
            sessions: getDexieDb().sessions,
            roles: getDexieDb().roles,
            cognitiveTraces: getDexieDb().cognitiveTraces,
            traces: getDexieDb().traces,
            skills: getDexieDb().skills,
            connectors: getDexieDb().connectors,
            keyValue: getDexieDb().keyValue,
            debateSessions: getDexieDb().debateSessions,
            debateVerdicts: getDexieDb().debateVerdicts,
            debateTimeline: getDexieDb().debateTimeline,
            debateOverrides: getDexieDb().debateOverrides,
            sessionLinks: getDexieDb().sessionLinks,
            eventLog: getDexieDb().eventLog,
        };
        const tables = Object.values(tableMap);
        await getDexieDb().transaction('rw', tables, async () => {
            for (const [tableName, rows] of Object.entries(data)) {
                const table = tableMap[tableName];
                if (!table) continue;
                let valid = rows.filter(
                    (r) => typeof r === 'object' && r !== null && !Array.isArray(r),
                ) as object[];

                if (tableName === 'apiKeys') {
                    const before = valid.length;
                    valid = (valid as Array<Record<string, unknown>>).filter((row) => {
                        const keyValue = typeof row.key === 'string' ? row.key : '';
                        const isMasked =
                            keyValue === REDACTED_MARKER ||
                            (keyValue.length > 8 && keyValue.includes(REDACTED_MARKER));
                        if (isMasked) {
                            LOGGER.warn(
                                'DatabaseService',
                                `importFromJson: skipping masked API key "${row.id ?? row.label ?? 'unknown'}" — would overwrite real key with ****`,
                            );
                        }
                        return !isMasked;
                    });
                    if (valid.length !== before) {
                        LOGGER.warn(
                            'DatabaseService',
                            `importFromJson: filtered ${before - valid.length} masked apiKeys to protect existing real keys`,
                        );
                    }
                }

                const schema = TABLE_SCHEMA_MAP[tableName];
                if (schema && valid.length > 0) {
                    const validated: unknown[] = [];
                    const errors: string[] = [];
                    for (const item of valid) {
                        const r = schema.safeParse(item);
                        if (r.success) {
                            validated.push(r.data);
                        } else {
                            const msg = r.error.issues[0]?.message ?? 'validation error';
                            if (errors.length < 5) errors.push(msg);
                        }
                    }
                    if (errors.length > 0) {
                        LOGGER.warn(
                            'DatabaseService',
                            `importFromJson: filtered ${errors.length}/${valid.length} rows from ${tableName} (Zod validation)`,
                            { firstErrors: errors },
                        );
                    }
                    valid = validated as object[];
                }

                if (valid.length !== rows.length) {
                    LOGGER.warn(
                        'DatabaseService',
                        `importFromJson: filtered ${rows.length - valid.length} invalid rows from ${tableName}`,
                    );
                }
                if (valid.length > 0) {
                    try {
                        await (table as Table).bulkPut(valid);
                    } catch (addErr) {
                        LOGGER.error(
                            'DatabaseService',
                            `importFromJson: bulkPut failed for ${tableName}, transaction will rollback`,
                            { error: addErr },
                        );
                        throw addErr;
                    }
                }
            }
        });
    }
}

export const db = new DatabaseService();
