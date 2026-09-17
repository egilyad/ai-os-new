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
import type { CrewRecord, CrewTaskRecord } from '../types/crew-types';
import type {
    CouncilMessageRecord,
    CouncilSessionRecord,
    CouncilVoteRecord,
} from '../types/council-types';
import type {
    DecisionEntry,
    GraphCheckpoint,
    GraphRecord,
    GraphRunRecord,
} from '../types/graph-types';
import type {
    ContextEntry,
    Goal,
    LongTermMemory,
    MemoryLink,
    PersonProfile,
    PersonaDepth,
    SharedContext,
    VoiceProfile,
} from '../types/persona-types';
import type {
    AuditEntry,
    HierarchyNode,
    McpServer,
    MissionWatch,
    MobileSession,
    PushNotification,
    SandboxTicket,
    SkillManifest,
    ToolGrant,
} from '../types/ops-types';
import type {
    A2AAgent,
    CollaborationContract,
    FederationPeer,
    HandoffRecord,
    MarketBid,
    MarketListing,
} from '../types/interop-types';
import type {
    CogMemory,
    CounterfactualRecord,
    Decomposition,
    HealthSignal,
    ImprovementProposal,
    KnowledgePackage,
    MemoryPolicy,
    StrategyRecord,
} from '../types/meta-types';
import type {
    CapabilityGrant,
    ExtensionManifest,
    GovAssignment,
    InstallBundle,
    OsSnapshot,
    PolicyRule,
    ProvenanceEdge,
    ProvenanceNode,
    SurfaceRecord,
    TrustScore,
} from '../types/trust-types';
import type {
    Benchmark,
    EvalRun,
    IntentPlan,
    ModalCapability,
    OrgCharter,
    RedFinding,
    Simulation,
    SocietyNorm,
} from '../types/frontier-types';
import type { KnowledgeSource, TrainGuide } from '../types/parity-types';
import type { ScopedMem } from '../types/rival2-types';
import type {
    AgentLoop,
    GroupChat,
    MemoryBlock,
    QueuedRun,
} from '../types/rival-types';
import type { GraphThread } from '../types/graph-types';
import type {
    Project,
    ProjectTask,
    ProjectRun,
    ProjectFile,
    ProjectArtifact,
    ProjectAgentAssignment,
} from '../types/project-types';
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
import type {
    AgentSkillLink,
    AgentToolLink,
    AgentResponsibility,
    AgentMetric,
    AgentMemory,
    AgentExecution,
    AgentConfigRevision,
    AgentApiKey,
    AgentBudget,
} from '../types/agems-agent';
import type { AgemsTask, TaskComment, Label, TaskLabel } from '../types/agems-task';
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
    // Phase 0 — AGEMS Agent Management (additive, isolated)
    agentSkills!: Table<AgentSkillLink>;
    agentTools!: Table<AgentToolLink>;
    agentResponsibilities!: Table<AgentResponsibility>;
    agentMetrics!: Table<AgentMetric>;
    agentMemory!: Table<AgentMemory>;
    agentExecutions!: Table<AgentExecution>;
    agentConfigRevisions!: Table<AgentConfigRevision>;
    agentApiKeys!: Table<AgentApiKey>;
    agentBudgets!: Table<AgentBudget>;
    // Phase 2 — AGEMS Tasks
    agemsTasks!: Table<AgemsTask>;
    taskComments!: Table<TaskComment>;
    labels!: Table<Label>;
    taskLabels!: Table<TaskLabel>;

    invocations!: Table<InvocationRecord>;
    invocationPolicies!: Table<InvocationPolicyRecord>;
    invocationCosts!: Table<InvocationCostRecord>;
    directorSessions!: Table<ConversationSession>;

    crews!: Table<CrewRecord>;
    crewTasks!: Table<CrewTaskRecord>;

    councilSessions!: Table<CouncilSessionRecord>;
    councilMessages!: Table<CouncilMessageRecord>;
    councilVotes!: Table<CouncilVoteRecord>;

    graphs!: Table<GraphRecord>;
    graphRuns!: Table<GraphRunRecord>;
    graphCheckpoints!: Table<GraphCheckpoint>;
    graphDecisions!: Table<DecisionEntry>;

    ltMemories!: Table<LongTermMemory>;
    memoryLinks!: Table<MemoryLink>;
    personaProfiles!: Table<PersonProfile>;
    voices!: Table<VoiceProfile>;
    personaDepths!: Table<PersonaDepth>;
    sharedContexts!: Table<SharedContext>;
    contextEntries!: Table<ContextEntry>;
    goals!: Table<Goal>;

    hierarchyNodes!: Table<HierarchyNode>;
    auditLog!: Table<AuditEntry>;
    mcpServers!: Table<McpServer>;
    toolGrants!: Table<ToolGrant>;
    sandboxTickets!: Table<SandboxTicket>;
    skillManifests!: Table<SkillManifest>;
    missionWatches!: Table<MissionWatch>;
    mobileSessions!: Table<MobileSession>;
    notifications!: Table<PushNotification>;

    a2aAgents!: Table<A2AAgent>;
    fedPeers!: Table<FederationPeer>;
    handoffs!: Table<HandoffRecord>;
    collabContracts!: Table<CollaborationContract>;
    marketListings!: Table<MarketListing>;
    marketBids!: Table<MarketBid>;

    improvements!: Table<ImprovementProposal>;
    strategies!: Table<StrategyRecord>;
    decompositions!: Table<Decomposition>;
    healthSignals!: Table<HealthSignal>;
    cogMemories!: Table<CogMemory>;
    memPolicies!: Table<MemoryPolicy>;
    counterfactuals!: Table<CounterfactualRecord>;
    knowledgePackages!: Table<KnowledgePackage>;

    capabilities!: Table<CapabilityGrant>;
    trustScores!: Table<TrustScore>;
    policyRules!: Table<PolicyRule>;
    govRoles!: Table<GovAssignment>;
    provenanceNodes!: Table<ProvenanceNode>;
    provenanceEdges!: Table<ProvenanceEdge>;
    extensions!: Table<ExtensionManifest>;
    bundles!: Table<InstallBundle>;
    surfaces!: Table<SurfaceRecord>;
    osSnapshots!: Table<OsSnapshot>;

    benchmarks!: Table<Benchmark>;
    evalRuns!: Table<EvalRun>;
    redFindings!: Table<RedFinding>;
    simulations!: Table<Simulation>;
    societyNorms!: Table<SocietyNorm>;
    orgs!: Table<OrgCharter>;
    intents!: Table<IntentPlan>;
    modalCaps!: Table<ModalCapability>;

    knowledgeSources!: Table<KnowledgeSource>;
    trainGuides!: Table<TrainGuide>;

    agentLoops!: Table<AgentLoop>;
    groupChats!: Table<GroupChat>;
    memoryBlocks!: Table<MemoryBlock>;
    runQueue!: Table<QueuedRun>;
    threads!: Table<GraphThread>;

    scopedMem!: Table<ScopedMem>;

    projects!: Table<Project>;
    projectTasks!: Table<ProjectTask>;
    projectRuns!: Table<ProjectRun>;
    projectFiles!: Table<ProjectFile>;
    projectArtifacts!: Table<ProjectArtifact>;
    projectAssignments!: Table<ProjectAgentAssignment>;

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

        // v23 — Crew + Task + Process (Roadmap Wave 1.1): additive, no upgrades.
        this.version(23).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
        });

        // v24 — Council / advanced debate (Roadmap Wave 2): additive, no upgrades.
        this.version(24).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
        });

        // v25 — State Graph runtime (Roadmap Wave 3): additive, no upgrades.
        this.version(25).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
        });

        // v26 — Persona & Context (Roadmap Wave 4): additive, no upgrades.
        this.version(26).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
        });

        // v27 — Ops / governance / mobile (Roadmap Wave 5): additive, no upgrades.
        this.version(27).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
        });

        // v28 — Interop / federation / coordination (Phase A): additive, no upgrades.
        this.version(28).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
        });

        // v29 — Meta & unified memory (Phase B): additive, no upgrades.
        this.version(29).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
        });

        // v30 — Trust & ecosystem (Phase C): additive, no upgrades.
        this.version(30).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
            capabilities: 'id, subject, capability, createdAt',
            trustScores: 'id, subject, createdAt',
            policyRules: 'id, action, subject, createdAt',
            govRoles: 'id, userId, role, createdAt',
            provenanceNodes: 'id, kind, createdAt',
            provenanceEdges: 'id, fromId, toId, createdAt',
            extensions: 'id, name, createdAt',
            bundles: 'id, name, createdAt',
            surfaces: 'id, surface, createdAt',
            osSnapshots: 'id, createdAt',
        });

        // v31 — Frontier evals & exotic (Phase D): additive, no upgrades.
        this.version(31).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
            capabilities: 'id, subject, capability, createdAt',
            trustScores: 'id, subject, createdAt',
            policyRules: 'id, action, subject, createdAt',
            govRoles: 'id, userId, role, createdAt',
            provenanceNodes: 'id, kind, createdAt',
            provenanceEdges: 'id, fromId, toId, createdAt',
            extensions: 'id, name, createdAt',
            bundles: 'id, name, createdAt',
            surfaces: 'id, surface, createdAt',
            osSnapshots: 'id, createdAt',
            benchmarks: 'id, name, createdAt',
            evalRuns: 'id, benchmarkId, createdAt',
            redFindings: 'id, target, createdAt',
            simulations: 'id, kind, createdAt',
            societyNorms: 'id, societyId, createdAt',
            orgs: 'id, status, createdAt',
            intents: 'id, createdAt',
            modalCaps: 'id, modality, agentId, createdAt',
        });

        // v32 — Parity tools/knowledge/training (GAP E.2/E.3): additive, no upgrades.
        this.version(32).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
            capabilities: 'id, subject, capability, createdAt',
            trustScores: 'id, subject, createdAt',
            policyRules: 'id, action, subject, createdAt',
            govRoles: 'id, userId, role, createdAt',
            provenanceNodes: 'id, kind, createdAt',
            provenanceEdges: 'id, fromId, toId, createdAt',
            extensions: 'id, name, createdAt',
            bundles: 'id, name, createdAt',
            surfaces: 'id, surface, createdAt',
            osSnapshots: 'id, createdAt',
            benchmarks: 'id, name, createdAt',
            evalRuns: 'id, benchmarkId, createdAt',
            redFindings: 'id, target, createdAt',
            simulations: 'id, kind, createdAt',
            societyNorms: 'id, societyId, createdAt',
            orgs: 'id, status, createdAt',
            intents: 'id, createdAt',
            modalCaps: 'id, modality, agentId, createdAt',
            knowledgeSources: 'id, kind, createdAt',
            trainGuides: 'id, role, createdAt',
        });

        // v33 — Rival parity (Phase F): additive, no upgrades.
        this.version(33).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
            capabilities: 'id, subject, capability, createdAt',
            trustScores: 'id, subject, createdAt',
            policyRules: 'id, action, subject, createdAt',
            govRoles: 'id, userId, role, createdAt',
            provenanceNodes: 'id, kind, createdAt',
            provenanceEdges: 'id, fromId, toId, createdAt',
            extensions: 'id, name, createdAt',
            bundles: 'id, name, createdAt',
            surfaces: 'id, surface, createdAt',
            osSnapshots: 'id, createdAt',
            benchmarks: 'id, name, createdAt',
            evalRuns: 'id, benchmarkId, createdAt',
            redFindings: 'id, target, createdAt',
            simulations: 'id, kind, createdAt',
            societyNorms: 'id, societyId, createdAt',
            orgs: 'id, status, createdAt',
            intents: 'id, createdAt',
            modalCaps: 'id, modality, agentId, createdAt',
            knowledgeSources: 'id, kind, createdAt',
            trainGuides: 'id, role, createdAt',
            agentLoops: 'id, kind, status, createdAt',
            groupChats: 'id, status, createdAt',
            memoryBlocks: 'id, ownerId, section, createdAt',
            runQueue: 'id, status, createdAt',
            threads: 'id, graphId, createdAt',
        });

        // v34 — Rival parity 2 (Phase G): consolidated schema, all tables.
        this.version(34).stores({
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
            crews: 'id, status, process, createdAt',
            crewTasks: 'id, crewId, status, assigneeId, createdAt',
            councilSessions: 'id, phase, status, createdAt',
            councilMessages: 'id, sessionId, channel, authorId, createdAt',
            councilVotes: 'id, sessionId, kind, voterId, createdAt',
            graphs: 'id, mode, createdAt',
            graphRuns: 'id, graphId, status, createdAt',
            graphCheckpoints: 'id, runId, stepIndex, createdAt',
            graphDecisions: 'id, runId, nodeId, createdAt',
            ltMemories: 'id, ownerId, tier, createdAt',
            memoryLinks: 'id, fromId, toId, createdAt',
            personaProfiles: 'id, ownerId, createdAt',
            voices: 'id, personId, createdAt',
            personaDepths: 'id, ownerId, createdAt',
            sharedContexts: 'id, createdAt',
            contextEntries: 'id, contextId, kind, createdAt',
            goals: 'id, ownerId, status, createdAt',
            hierarchyNodes: 'id, parentId, createdAt',
            auditLog: 'id, seq, action, createdAt',
            mcpServers: 'id, name, createdAt',
            toolGrants: 'id, agentId, createdAt',
            sandboxTickets: 'id, kind, status, agentId, createdAt',
            skillManifests: 'id, name, createdAt',
            missionWatches: 'id, kind, ref, createdAt',
            mobileSessions: 'id, status, createdAt',
            notifications: 'id, read, createdAt',
            a2aAgents: 'id, name, trust, createdAt',
            fedPeers: 'id, trust, createdAt',
            handoffs: 'id, target, status, createdAt',
            collabContracts: 'id, status, createdAt',
            marketListings: 'id, status, createdAt',
            marketBids: 'id, listingId, bidderId, createdAt',
            improvements: 'id, kind, status, createdAt',
            strategies: 'id, taskClass, createdAt',
            decompositions: 'id, createdAt',
            healthSignals: 'id, kind, createdAt',
            cogMemories: 'id, ownerId, kind, scope, createdAt',
            memPolicies: 'id, scope, createdAt',
            counterfactuals: 'id, ownerId, createdAt',
            knowledgePackages: 'id, taskClass, createdAt',
            capabilities: 'id, subject, capability, createdAt',
            trustScores: 'id, subject, createdAt',
            policyRules: 'id, action, subject, createdAt',
            govRoles: 'id, userId, role, createdAt',
            provenanceNodes: 'id, kind, createdAt',
            provenanceEdges: 'id, fromId, toId, createdAt',
            extensions: 'id, name, createdAt',
            bundles: 'id, name, createdAt',
            surfaces: 'id, surface, createdAt',
            osSnapshots: 'id, createdAt',
            benchmarks: 'id, name, createdAt',
            evalRuns: 'id, benchmarkId, createdAt',
            redFindings: 'id, target, createdAt',
            simulations: 'id, kind, createdAt',
            societyNorms: 'id, societyId, createdAt',
            orgs: 'id, status, createdAt',
            intents: 'id, createdAt',
            modalCaps: 'id, modality, agentId, createdAt',
            knowledgeSources: 'id, kind, createdAt',
            trainGuides: 'id, role, createdAt',
            agentLoops: 'id, kind, status, createdAt',
            groupChats: 'id, status, createdAt',
            memoryBlocks: 'id, ownerId, section, createdAt',
            runQueue: 'id, status, createdAt',
            threads: 'id, graphId, createdAt',
            scopedMem: 'id, scope, ownerId, createdAt',
        });

        // v35 — Project system (roadmapp.md P1): additive, no upgrades.
        this.version(35).stores({
            projects: 'id, status, type, createdAt, updatedAt',
            projectTasks: 'id, projectId, agentId, status, priority, createdAt',
            projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
            projectFiles: '[projectId+path], projectId, path',
            projectArtifacts: 'id, projectId, type, createdAt',
            projectAssignments: '[projectId+agentId], projectId, agentId',
        });

        // v36 — AGEMS Phase 0 (Agent Management): additive, no upgrades.
        this.version(36).stores({
            agentSkills: '++id, agentId, skillId, [agentId+skillId]',
            agentTools: '++id, agentId, toolId, [agentId+toolId]',
            agentResponsibilities: '++id, agentId, priority, createdAt',
            agentMetrics: '++id, agentId, metricType, periodStart, [agentId+metricType]',
            agentMemory: '++id, agentId, type, createdAt, expiresAt',
            agentExecutions: 'id, agentId, status, triggerType, startedAt',
            agentConfigRevisions: '++id, agentId, version, createdAt, [agentId+version]',
            agentApiKeys: 'id, agentId, createdAt',
            agentBudgets: '++id, agentId, periodStart',
        });

        // v37 — AGEMS Phase 2 (Tasks): additive
        this.version(37).stores({
            agemsTasks: 'id, status, priority, assigneeId, creatorId, projectId, createdAt, updatedAt',
            taskComments: '++id, taskId, createdAt',
            labels: '++id, name',
            taskLabels: '++id, taskId, labelId, [taskId+labelId]',
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
            {
                v: 22,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                },
            },
            {
                v: 23,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                },
            },
            {
                v: 24,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                },
            },
            {
                v: 25,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                },
            },
            {
                v: 26,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                },
            },
            {
                v: 27,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                },
            },
            {
                v: 28,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                },
            },
            {
                v: 29,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                },
            },
            {
                v: 30,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                },
            },
            {
                v: 31,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                },
            },
            {
                v: 32,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                    knowledgeSources: 'id, kind, createdAt',
                    trainGuides: 'id, role, createdAt',
                },
            },
            {
                v: 33,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                    knowledgeSources: 'id, kind, createdAt',
                    trainGuides: 'id, role, createdAt',
                    agentLoops: 'id, kind, status, createdAt',
                    groupChats: 'id, status, createdAt',
                    memoryBlocks: 'id, ownerId, section, createdAt',
                    runQueue: 'id, status, createdAt',
                    threads: 'id, graphId, createdAt',
                },
            },
            {
                v: 34,
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
                    directorSessions: 'id, scenarioId, status, createdAt, updatedAt',
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                    knowledgeSources: 'id, kind, createdAt',
                    trainGuides: 'id, role, createdAt',
                    agentLoops: 'id, kind, status, createdAt',
                    groupChats: 'id, status, createdAt',
                    memoryBlocks: 'id, ownerId, section, createdAt',
                    runQueue: 'id, status, createdAt',
                    threads: 'id, graphId, createdAt',
                    scopedMem: 'id, scope, ownerId, createdAt',
                },
            },
            {
                v: 34,
                tables: {
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
                    crystals: 'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
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
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                    knowledgeSources: 'id, kind, createdAt',
                    trainGuides: 'id, role, createdAt',
                    agentLoops: 'id, kind, status, createdAt',
                    groupChats: 'id, status, createdAt',
                    memoryBlocks: 'id, ownerId, section, createdAt',
                    runQueue: 'id, status, createdAt',
                    threads: 'id, graphId, createdAt',
                    scopedMem: 'id, scope, ownerId, createdAt',
                },
            },
            {
                v: 35,
                tables: {
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
                    crystals: 'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
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
                    crews: 'id, status, process, createdAt',
                    crewTasks: 'id, crewId, status, assigneeId, createdAt',
                    councilSessions: 'id, phase, status, createdAt',
                    councilMessages: 'id, sessionId, channel, authorId, createdAt',
                    councilVotes: 'id, sessionId, kind, voterId, createdAt',
                    graphs: 'id, mode, createdAt',
                    graphRuns: 'id, graphId, status, createdAt',
                    graphCheckpoints: 'id, runId, stepIndex, createdAt',
                    graphDecisions: 'id, runId, nodeId, createdAt',
                    ltMemories: 'id, ownerId, tier, createdAt',
                    memoryLinks: 'id, fromId, toId, createdAt',
                    personaProfiles: 'id, ownerId, createdAt',
                    voices: 'id, personId, createdAt',
                    personaDepths: 'id, ownerId, createdAt',
                    sharedContexts: 'id, createdAt',
                    contextEntries: 'id, contextId, kind, createdAt',
                    goals: 'id, ownerId, status, createdAt',
                    hierarchyNodes: 'id, parentId, createdAt',
                    auditLog: 'id, seq, action, createdAt',
                    mcpServers: 'id, name, createdAt',
                    toolGrants: 'id, agentId, createdAt',
                    sandboxTickets: 'id, kind, status, agentId, createdAt',
                    skillManifests: 'id, name, createdAt',
                    missionWatches: 'id, kind, ref, createdAt',
                    mobileSessions: 'id, status, createdAt',
                    notifications: 'id, read, createdAt',
                    a2aAgents: 'id, name, trust, createdAt',
                    fedPeers: 'id, trust, createdAt',
                    handoffs: 'id, target, status, createdAt',
                    collabContracts: 'id, status, createdAt',
                    marketListings: 'id, status, createdAt',
                    marketBids: 'id, listingId, bidderId, createdAt',
                    improvements: 'id, kind, status, createdAt',
                    strategies: 'id, taskClass, createdAt',
                    decompositions: 'id, createdAt',
                    healthSignals: 'id, kind, createdAt',
                    cogMemories: 'id, ownerId, kind, scope, createdAt',
                    memPolicies: 'id, scope, createdAt',
                    counterfactuals: 'id, ownerId, createdAt',
                    knowledgePackages: 'id, taskClass, createdAt',
                    capabilities: 'id, subject, capability, createdAt',
                    trustScores: 'id, subject, createdAt',
                    policyRules: 'id, action, subject, createdAt',
                    govRoles: 'id, userId, role, createdAt',
                    provenanceNodes: 'id, kind, createdAt',
                    provenanceEdges: 'id, fromId, toId, createdAt',
                    extensions: 'id, name, createdAt',
                    bundles: 'id, name, createdAt',
                    surfaces: 'id, surface, createdAt',
                    osSnapshots: 'id, createdAt',
                    benchmarks: 'id, name, createdAt',
                    evalRuns: 'id, benchmarkId, createdAt',
                    redFindings: 'id, target, createdAt',
                    simulations: 'id, kind, createdAt',
                    societyNorms: 'id, societyId, createdAt',
                    orgs: 'id, status, createdAt',
                    intents: 'id, createdAt',
                    modalCaps: 'id, modality, agentId, createdAt',
                    knowledgeSources: 'id, kind, createdAt',
                    trainGuides: 'id, role, createdAt',
                    agentLoops: 'id, kind, status, createdAt',
                    groupChats: 'id, status, createdAt',
                    memoryBlocks: 'id, ownerId, section, createdAt',
                    runQueue: 'id, status, createdAt',
                    threads: 'id, graphId, createdAt',
                    scopedMem: 'id, scope, ownerId, createdAt',
                    projects: 'id, status, type, createdAt, updatedAt',
                    projectTasks: 'id, projectId, agentId, status, priority, createdAt',
                    projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
                    projectFiles: '[projectId+path], projectId, path',
                    projectArtifacts: 'id, projectId, type, createdAt',
                    projectAssignments: '[projectId+agentId], projectId, agentId',
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
