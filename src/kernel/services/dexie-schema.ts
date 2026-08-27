import Dexie, { type Table } from 'dexie';
import type { KeyNote, ApiKey } from '../types/metrics-types';
import type { MemoryEntry } from '../types/memory-types';
import type { ChatSession } from '../contracts/storage/session-store';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../types/domain-types';
import type { ExecutionTrace } from '../contracts/observability';
import type { Role } from '../types/role-types';
import type { Crystal } from '../types/crystal-types';
import type { Junction } from '../types/junction-types';
import type { SynthesisSessionRecord, SynthesisPerspectiveRecord } from '../types/synthesis-types';
import type { GenerationJobRecord } from '../types/generator-types';
import type {
    ForumPostRecord,
    ForumSubRecord,
    ForumTopicRecord,
    ForumVoteRecord,
} from '../types/forum-types';
import type { WorkflowRecord } from '../types/builder-types';
import type { ConversationScenario } from '../contracts/conversation';
import type { ConversationSession } from '../contracts/conversation/session';
import type {
    InvocationRecord,
    InvocationPolicyRecord,
    InvocationCostRecord,
} from '../types/invocation-types';
import {
    MemoryEntrySchema,
    CognitiveTraceSchema,
    ChatSessionSchema,
    KeyNoteSchema,
    RoleSchema,
    ExecutionTraceSchema,
    CognitiveSkillSchema,
    ConnectorSchema,
    KeyValueSchema,
    ApiKeySchema,
} from '../../types/schemas';
import {
    DebateSessionRecordSchema,
    DebateVerdictRecordSchema,
    DebateTimelineEntrySchema,
    DebateOverrideSchema,
    SessionLinkSchema,
    EventLogEntrySchema,
    ConversationScenarioSchema,
} from '../types/schema-types';
import type { DebateSessionRecord, DebateVerdictRecord } from '../contracts/storage/debate-store';
import type {
    DebateTimelineEntry,
    DebateOverride,
    SessionLink,
} from '../contracts/session-manager';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('DatabaseService');

export const REDACTED_MARKER = '[REDACTED]';

export interface QueryResult<T> {
    rows: T[];
    affectedRows: number;
}

// Schema for EventRecorder persistence (Dexie store)
export interface RecordedEventRow {
    id?: number; // auto-increment
    sequence: number;
    event: string;
    dataJson: string; // JSON.stringify(data)
    checksum: string;
    timestamp: number;
}

export class SuperAgentsDB extends Dexie {
    notes!: Table<KeyNote>;
    memories!: Table<MemoryEntry>;
    apiKeys!: Table<ApiKey>;
    sessions!: Table<ChatSession>;

    roles!: Table<Role>;
    cognitiveTraces!: Table<CognitiveTrace>;
    traces!: Table<ExecutionTrace>;
    skills!: Table<CognitiveSkill>;
    connectors!: Table<Connector>;
    keyValue!: Table<{ id: string; value: unknown; createdAt?: number; version?: number }>;
    debateSessions!: Table<DebateSessionRecord>;
    debateVerdicts!: Table<DebateVerdictRecord>;

    debateTimeline!: Table<DebateTimelineEntry>;
    debateOverrides!: Table<DebateOverride>;
    sessionLinks!: Table<SessionLink>;

    eventLog!: Table<RecordedEventRow>;

    crystals!: Table<Crystal>;
    crystalVersions!: Table<Crystal>;

    junctions!: Table<Junction>;

    synthSessions!: Table<SynthesisSessionRecord>;
    synthPerspectives!: Table<SynthesisPerspectiveRecord>;

    genJobs!: Table<GenerationJobRecord>;

    forumTopics!: Table<ForumTopicRecord>;
    forumPosts!: Table<ForumPostRecord>;
    forumVotes!: Table<ForumVoteRecord>;
    forumSubs!: Table<ForumSubRecord>;

    workflows!: Table<WorkflowRecord>;

    scenarios!: Table<ConversationScenario>;

    invocations!: Table<InvocationRecord>;
    invocationPolicies!: Table<InvocationPolicyRecord>;
    invocationCosts!: Table<InvocationCostRecord>;
    directorSessions!: Table<ConversationSession>;

    constructor() {
        super('super_agents_os_v4');

        this.version(5).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id',
        });

        this.version(6)
            .stores({
                notes: 'id, keyId, type, timestamp',
                memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                apiKeys: 'id, provider, status',
                sessions: 'id, title, updatedAt',
                roles: 'id, name, metadata.category',
                cognitiveTraces: 'id, traceId, startTime, status',
                traces: 'id, startTime, status',
                skills: 'id, name, category, status',
                connectors: 'id, name, type, status',
                keyValue: 'id, createdAt',
            })
            .upgrade(async (tx) => {
                const kvTable = tx.table('keyValue');
                await kvTable.toCollection().modify((obj) => {
                    if (!obj.createdAt) obj.createdAt = Date.now();
                });
            });

        this.version(7).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
        });

        this.version(8).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
        });

        this.version(9)
            .stores({
                notes: 'id, keyId, type, timestamp',
                memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                apiKeys: 'id, provider, status',
                sessions: 'id, title, updatedAt',
                roles: 'id, name, metadata.category',
                cognitiveTraces: 'id, traceId, startTime, status',
                traces: 'id, startTime, status',
                skills: 'id, name, category, status',
                connectors: 'id, name, type, status',
                keyValue: 'id, createdAt',
                debateSessions: 'id, phase, updatedAt',
                debateVerdicts: 'sessionId',
            })
            .upgrade(async (tx) => {
                const kvTable = tx.table('keyValue');
                const oldIndex = await kvTable.get('debate:sessions:index');
                if (oldIndex?.value && Array.isArray(oldIndex.value)) {
                    const sessions = oldIndex.value as DebateSessionRecord[];
                    const destTable = tx.table('debateSessions');
                    await destTable.bulkPut(sessions);
                    await kvTable.delete('debate:sessions:index');
                }
            });

        this.version(10).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt',
            debateVerdicts: 'sessionId',
            eventLog: '++id, sequence, event, timestamp',
        });

        this.version(11)
            .stores({
                notes: 'id, keyId, type, timestamp',
                memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                apiKeys: 'id, provider, status',
                sessions: 'id, title, updatedAt',
                roles: 'id, name, metadata.category',
                cognitiveTraces: 'id, traceId, startTime, status',
                traces: 'id, startTime, status',
                skills: 'id, name, category, status',
                connectors: 'id, name, type, status',
                keyValue: 'id, createdAt',
                debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                debateVerdicts: 'sessionId',
                debateTimeline: 'id, sessionId, timestamp, type',
                debateOverrides: 'id, sessionId, appliedAt',
                sessionLinks: 'id, fromId, toId, linkType',
                eventLog: '++id, sequence, event, timestamp',
            })
            .upgrade(async (tx) => {
                const debateTable = tx.table('debateSessions');
                const kvTable = tx.table('keyValue');
                const ACTIVE_SESSION_ID = '__debate_active_session__';
                const HISTORY_LIST_ID = '__debate_history_list__';

                const oldActive = await debateTable.get(ACTIVE_SESSION_ID);
                if (oldActive) {
                    await debateTable.delete(ACTIVE_SESSION_ID);
                    await debateTable.put({
                        ...oldActive,
                        tags: [],
                        folder: '',
                        isArchived: false,
                    });
                }

                const oldHistory = await debateTable.get(HISTORY_LIST_ID);
                if (oldHistory) {
                    try {
                        const sessions = safeJsonParse(oldHistory.arguments || '[]');
                        if (Array.isArray(sessions)) {
                            for (const s of sessions) {
                                const record: Record<string, unknown> = {
                                    id: s.id || crypto.randomUUID(),
                                    topic: s.topic || '(untitled)',
                                    topologyType: s.strategy || 'roundtable',
                                    phase: s.status || 'completed',
                                    round: s.currentRound || 0,
                                    totalTokens: s.totalTokens ?? 0,
                                    totalCost: s.totalCost ?? 0,
                                    agentStates: JSON.stringify(
                                        s.arguments?.map((a: Record<string, unknown>) => ({
                                            agentId: a.agentId,
                                            nodeId: a.agentName,
                                            phase: 'idle',
                                            round: a.round,
                                            tokensUsed: 0,
                                            latency: 0,
                                            lastActiveAt: a.timestamp,
                                        })) || [],
                                    ),
                                    arguments: JSON.stringify(s.arguments || []),
                                    topology: '{}',
                                    participants: JSON.stringify(s.participants || []),
                                    startedAt: s.createdAt ?? Date.now(),
                                    updatedAt: Date.now(),
                                    createdAt: s.createdAt ?? Date.now(),
                                    tags: s.tags ?? [],
                                    folder: s.folder ?? '',
                                    isArchived: true,
                                };
                                await debateTable.put(record);
                            }
                        }
                    } catch (e) {
                        LOGGER.warn(
                            'DatabaseService',
                            'v11 migration: failed to parse history list',
                            { error: e },
                        );
                    }
                    await debateTable.delete(HISTORY_LIST_ID);
                }

                const legacyKv = await kvTable.get('debate_session');
                if (legacyKv?.value && typeof legacyKv.value === 'object') {
                    const s = legacyKv.value as Record<string, unknown>;
                    const record: Record<string, unknown> = {
                        id: (s.id as string) || crypto.randomUUID(),
                        topic: s.topic || '(untitled)',
                        topologyType: (s as Record<string, string>).strategy || 'roundtable',
                        phase: (s as Record<string, string>).status || 'completed',
                        round: (s as Record<string, number>).currentRound || 0,
                        totalTokens: (s as Record<string, number>).totalTokens ?? 0,
                        totalCost: (s as Record<string, number>).totalCost ?? 0,
                        agentStates: '[]',
                        arguments: JSON.stringify((s as Record<string, unknown[]>).arguments || []),
                        topology: '{}',
                        participants: JSON.stringify(
                            (s as Record<string, unknown[]>).participants || [],
                        ),
                        startedAt: (s as Record<string, number>).createdAt ?? Date.now(),
                        updatedAt: Date.now(),
                        createdAt: (s as Record<string, number>).createdAt ?? Date.now(),
                        tags: [],
                        folder: '',
                        isArchived: true,
                    };
                    await debateTable.put(record);
                    await kvTable.delete('debate_session');
                }

                const existingAll = await debateTable.toArray();
                for (const rec of existingAll) {
                    if (
                        rec.tags === undefined ||
                        rec.folder === undefined ||
                        rec.isArchived === undefined
                    ) {
                        await debateTable.update(rec.id, {
                            tags: (rec as Record<string, unknown>).tags ?? [],
                            folder: (rec as Record<string, unknown>).folder ?? '',
                            isArchived: (rec as Record<string, unknown>).isArchived ?? false,
                        });
                    }
                }
            });

        this.version(12)
            .stores({
                notes: 'id, keyId, type, timestamp',
                memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                apiKeys: 'id, provider, status',
                sessions: 'id, title, updatedAt',
                roles: 'id, name, metadata.category',
                cognitiveTraces: 'id, traceId, startTime, status',
                traces: 'id, startTime, status',
                skills: 'id, name, category, status',
                connectors: 'id, name, type, status',
                keyValue: 'id, createdAt',
                debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                debateVerdicts: 'sessionId',
                debateTimeline: 'id, sessionId, timestamp, type',
                debateOverrides: 'id, sessionId, appliedAt',
                sessionLinks: 'id, fromId, toId, linkType',
                eventLog: '++id, sequence, event, timestamp',
            })
            .upgrade(async (tx) => {
                const debateTable = tx.table('debateSessions');
                const ACTIVE_SESSION_ID = '__debate_active_session__';
                const oldActive = await debateTable.get(ACTIVE_SESSION_ID);
                if (oldActive) {
                    try {
                        const parsedArgs = oldActive.arguments
                            ? safeJsonParse(oldActive.arguments)
                            : null;
                        const realId =
                            parsedArgs && Array.isArray(parsedArgs)
                                ? oldActive.id.length > 20
                                    ? oldActive.id
                                    : crypto.randomUUID()
                                : crypto.randomUUID();
                        const idToUse = realId !== ACTIVE_SESSION_ID ? realId : crypto.randomUUID();
                        await debateTable.put({
                            ...oldActive,
                            id: idToUse,
                            tags: [],
                            folder: '',
                            isArchived: false,
                        });
                        await debateTable.delete(ACTIVE_SESSION_ID);
                        LOGGER.info(
                            'DatabaseService',
                            'v12: migrated active session magic key to real ID',
                            { id: idToUse },
                        );
                    } catch (e) {
                        LOGGER.warn('DatabaseService', 'v12: failed to migrate active session', {
                            error: e,
                        });
                        await debateTable.delete(ACTIVE_SESSION_ID);
                    }
                }

                const HISTORY_LIST_ID = '__debate_history_list__';
                const oldHistory = await debateTable.get(HISTORY_LIST_ID);
                if (oldHistory) {
                    await debateTable.delete(HISTORY_LIST_ID);
                    LOGGER.info(
                        'DatabaseService',
                        'v12: cleaned up orphaned history list magic key',
                    );
                }
            });

        this.version(13).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
        });

        this.version(14).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
        });

        this.version(15).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
        });

        this.version(16).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
        });

        this.version(17).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
        });

        this.version(18).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
            workflows: 'id, status, version, createdAt',
        });

        this.version(19).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
            workflows: 'id, status, version, createdAt',
            scenarios: 'id, status, version, createdAt',
        });

        this.version(20).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
            workflows: 'id, status, version, createdAt',
            scenarios: 'id, status, version, createdAt',
            invocations: 'id, status, callerKind, contextType, policyRef, createdAt',
            invocationPolicies: 'id, enabled, domain, source, priority',
        });

        this.version(21).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
            workflows: 'id, status, version, createdAt',
            scenarios: 'id, status, version, createdAt',
            invocations: 'id, status, callerKind, contextType, policyRef, createdAt',
            invocationPolicies: 'id, enabled, domain, source, priority',
            invocationCosts: 'invocationId, updatedAt',
        });

        // v22 — Director run-history persistence (Q7): live ConversationSession
        // records (with operator checkpoints) survive reload so the Director
        // panel can show past runs.
        this.version(22).stores({
            notes: 'id, keyId, type, timestamp',
            memories: 'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
            apiKeys: 'id, provider, status',
            sessions: 'id, title, updatedAt',
            roles: 'id, name, metadata.category',
            cognitiveTraces: 'id, traceId, startTime, status',
            traces: 'id, startTime, status',
            skills: 'id, name, category, status',
            connectors: 'id, name, type, status',
            keyValue: 'id, createdAt',
            debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
            debateVerdicts: 'sessionId',
            debateTimeline: 'id, sessionId, timestamp, type',
            debateOverrides: 'id, sessionId, appliedAt',
            sessionLinks: 'id, fromId, toId, linkType',
            eventLog: '++id, sequence, event, timestamp',
            crystals:
                'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
            crystalVersions: '[crystalId+version], crystalId',
            junctions: 'id, status, synthesisType, createdAt',
            synthSessions: 'id, status, createdAt',
            synthPerspectives: 'id, synthesisId, roleId, lensId',
            genJobs: 'id, status, trigger.kind, createdAt',
            forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
            forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
            forumVotes: 'id, postId, voterId, [postId+voterId]',
            forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
            workflows: 'id, status, version, createdAt',
            scenarios: 'id, status, version, createdAt',
            invocations: 'id, status, callerKind, contextType, policyRef, createdAt',
            invocationPolicies: 'id, enabled, domain, source, priority',
            invocationCosts: 'invocationId, updatedAt',
            directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
        });

        const rejectHook =
            (schema: { parse: (data: unknown) => unknown }, label: string) =>
            (_primKey: unknown, obj: unknown): boolean | undefined => {
                try {
                    schema.parse(obj);
                    return undefined;
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    LOGGER.error(
                        'DatabaseService',
                        `${label} validation FAILED — rejecting write: ${msg}`,
                    );
                    return false;
                }
            };

        this.memories.hook('creating', rejectHook(MemoryEntrySchema, 'MemoryEntry'));
        this.memories.hook('updating', (mods, _primKey, obj) => {
            try {
                MemoryEntrySchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'MemoryEntry update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.cognitiveTraces.hook('creating', rejectHook(CognitiveTraceSchema, 'CognitiveTrace'));
        this.cognitiveTraces.hook('updating', (mods, _primKey, obj) => {
            try {
                CognitiveTraceSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'CognitiveTrace update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.sessions.hook('creating', rejectHook(ChatSessionSchema, 'ChatSession'));
        this.sessions.hook('updating', (mods, _primKey, obj) => {
            try {
                ChatSessionSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'ChatSession update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.notes.hook('creating', rejectHook(KeyNoteSchema, 'KeyNote'));
        this.notes.hook('updating', (mods, _primKey, obj) => {
            try {
                KeyNoteSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'KeyNote update validation FAILED');
                return false;
            }
        });

        this.apiKeys.hook('creating', rejectHook(ApiKeySchema, 'ApiKey'));
        this.apiKeys.hook('updating', (mods, _primKey, obj) => {
            try {
                ApiKeySchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'ApiKey update validation FAILED');
                return false;
            }
        });

        this.roles.hook('creating', rejectHook(RoleSchema, 'Role'));
        this.roles.hook('updating', (mods, _primKey, obj) => {
            try {
                RoleSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'Role update validation FAILED');
                return false;
            }
        });

        this.traces.hook('creating', rejectHook(ExecutionTraceSchema, 'ExecutionTrace'));
        this.traces.hook('updating', (mods, _primKey, obj) => {
            try {
                ExecutionTraceSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'ExecutionTrace update validation FAILED');
                return false;
            }
        });

        this.skills.hook('creating', rejectHook(CognitiveSkillSchema, 'CognitiveSkill'));
        this.skills.hook('updating', (mods, _primKey, obj) => {
            try {
                CognitiveSkillSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'CognitiveSkill update validation FAILED');
                return false;
            }
        });

        this.connectors.hook('creating', rejectHook(ConnectorSchema, 'Connector'));
        this.connectors.hook('updating', (mods, _primKey, obj) => {
            try {
                ConnectorSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'Connector update validation FAILED');
                return false;
            }
        });

        this.keyValue.hook('creating', rejectHook(KeyValueSchema, 'KeyValue'));
        this.keyValue.hook('updating', (mods, _primKey, obj) => {
            try {
                KeyValueSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'KeyValue update validation FAILED');
                return false;
            }
        });

        this.debateSessions.hook(
            'creating',
            rejectHook(DebateSessionRecordSchema, 'DebateSession'),
        );
        this.debateSessions.hook('updating', (mods, _primKey, obj) => {
            try {
                DebateSessionRecordSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'DebateSession update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.debateVerdicts.hook(
            'creating',
            rejectHook(DebateVerdictRecordSchema, 'DebateVerdict'),
        );
        this.debateVerdicts.hook('updating', (mods, _primKey, obj) => {
            try {
                DebateVerdictRecordSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'DebateVerdict update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.debateTimeline.hook(
            'creating',
            rejectHook(DebateTimelineEntrySchema, 'DebateTimeline'),
        );
        this.debateTimeline.hook('updating', (mods, _primKey, obj) => {
            try {
                DebateTimelineEntrySchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'DebateTimeline update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.debateOverrides.hook('creating', rejectHook(DebateOverrideSchema, 'DebateOverride'));
        this.debateOverrides.hook('updating', (mods, _primKey, obj) => {
            try {
                DebateOverrideSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'DebateOverride update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.sessionLinks.hook('creating', rejectHook(SessionLinkSchema, 'SessionLink'));
        this.sessionLinks.hook('updating', (mods, _primKey, obj) => {
            try {
                SessionLinkSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'SessionLink update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.eventLog.hook('creating', rejectHook(EventLogEntrySchema, 'EventLog'));
        this.eventLog.hook('updating', (mods, _primKey, obj) => {
            try {
                EventLogEntrySchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'EventLog update validation FAILED', { error: e });
                return false;
            }
        });

        this.scenarios.hook(
            'creating',
            rejectHook(ConversationScenarioSchema, 'ConversationScenario'),
        );
        this.scenarios.hook('updating', (mods, _primKey, obj) => {
            try {
                ConversationScenarioSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch (e) {
                LOGGER.error('DatabaseService', 'ConversationScenario update validation FAILED', {
                    error: e,
                });
                return false;
            }
        });

        this.validateMigrations();
    }

    private validateMigrations(): void {
        const versionDefs: Array<{ v: number; tables: Record<string, string> }> = [
            {
                v: 5,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id',
                },
            },
            {
                v: 6,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                },
            },
            {
                v: 7,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                },
            },
            {
                v: 8,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                },
            },
            {
                v: 9,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt',
                    debateVerdicts: 'sessionId',
                },
            },
            {
                v: 10,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt',
                    debateVerdicts: 'sessionId',
                    eventLog: '++id, sequence, event, timestamp',
                },
            },
            {
                v: 11,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                },
            },
            {
                v: 12,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                },
            },
            {
                v: 13,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                },
            },
            {
                v: 14,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                },
            },
            {
                v: 15,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                },
            },
            {
                v: 16,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                },
            },
            {
                v: 17,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                    forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
                    forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
                    forumVotes: 'id, postId, voterId, [postId+voterId]',
                    forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
                },
            },
            {
                v: 18,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                    forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
                    forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
                    forumVotes: 'id, postId, voterId, [postId+voterId]',
                    forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
                    workflows: 'id, status, version, createdAt',
                },
            },
            {
                v: 19,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                    forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
                    forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
                    forumVotes: 'id, postId, voterId, [postId+voterId]',
                    forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
                    workflows: 'id, status, version, createdAt',
                    scenarios: 'id, status, version, createdAt',
                },
            },
            {
                v: 20,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                    forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
                    forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
                    forumVotes: 'id, postId, voterId, [postId+voterId]',
                    forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
                    workflows: 'id, status, version, createdAt',
                    scenarios: 'id, status, version, createdAt',
                    invocations: 'id, status, callerKind, contextType, policyRef, createdAt',
                    invocationPolicies: 'id, enabled, domain, source, priority',
                },
            },
            {
                v: 21,
                tables: {
                    notes: 'id, keyId, type, timestamp',
                    memories:
                        'id, content, [metadata.source], [metadata.type], [metadata.timestamp]',
                    apiKeys: 'id, provider, status',
                    sessions: 'id, title, updatedAt',
                    roles: 'id, name, metadata.category',
                    cognitiveTraces: 'id, traceId, startTime, status',
                    traces: 'id, startTime, status',
                    skills: 'id, name, category, status',
                    connectors: 'id, name, type, status',
                    keyValue: 'id, createdAt',
                    debateSessions: 'id, phase, updatedAt, topic, folder, isArchived',
                    debateVerdicts: 'sessionId',
                    debateTimeline: 'id, sessionId, timestamp, type',
                    debateOverrides: 'id, sessionId, appliedAt',
                    sessionLinks: 'id, fromId, toId, linkType',
                    eventLog: '++id, sequence, event, timestamp',
                    crystals:
                        'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
                    crystalVersions: '[crystalId+version], crystalId',
                    junctions: 'id, status, synthesisType, createdAt',
                    synthSessions: 'id, status, createdAt',
                    synthPerspectives: 'id, synthesisId, roleId, lensId',
                    genJobs: 'id, status, trigger.kind, createdAt',
                    forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
                    forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
                    forumVotes: 'id, postId, voterId, [postId+voterId]',
                    forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
                    workflows: 'id, status, version, createdAt',
                    scenarios: 'id, status, version, createdAt',
                    invocations: 'id, status, callerKind, contextType, policyRef, createdAt',
                    invocationPolicies: 'id, enabled, domain, source, priority',
                    invocationCosts: 'invocationId, updatedAt',
                },
            },
        ];

        for (let i = 1; i < versionDefs.length; i++) {
            const prev = versionDefs[i - 1]!;
            const curr = versionDefs[i]!;
            for (const table of Object.keys(prev.tables)) {
                if (!curr.tables[table]) {
                    LOGGER.warn(
                        'DatabaseService',
                        `Migration v${prev.v}→v${curr.v}: table '${table}' dropped. Data loss possible if upgrade handler missing.`,
                    );
                } else if (prev.tables[table] !== curr.tables[table]) {
                    const prevIdxs = prev.tables[table]!.split(', ').sort().join(', ');
                    const currIdxs = curr.tables[table]!.split(', ').sort().join(', ');
                    if (prevIdxs !== currIdxs) {
                        LOGGER.info(
                            'DatabaseService',
                            `Migration v${prev.v}→v${curr.v}: table '${table}' indexes changed: [${prev.tables[table]}] → [${curr.tables[table]}]`,
                        );
                    }
                }
            }
        }
    }
}
