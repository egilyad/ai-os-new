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
import type { AgentLoop, GroupChat, MemoryBlock, QueuedRun } from '../types/rival-types';
import type { GraphThread } from '../types/graph-types';
import type {
    Project,
    ProjectTask,
    ProjectRun,
    ProjectFile,
    ProjectArtifact,
    ProjectAgentAssignment,
} from '../types/project-types';
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
    AgentRepository,
} from '../types/agems-agent';
import type {
    AgemsTask,
    TaskComment,
    Label,
    TaskLabel,
    TaskWorkProduct,
    TaskTrigger,
} from '../types/agems-task';
import type { ApprovalPolicy, ApprovalRequest } from '../types/agems-approval';
import type { PlatformBudget, BudgetIncident } from '../types/agems-budget';
import type { Meeting, MeetingDecision } from '../types/agems-meeting';
import type { CatalogAgent } from '../types/agems-catalog';
import type { AuditLog } from '../types/agems-audit';
import type { DebateSessionRecord, DebateVerdictRecord } from '../contracts/storage/debate-store';
import type {
    DebateTimelineEntry,
    DebateOverride,
    SessionLink,
} from '../contracts/session-manager';
import { DEXIE_VERSION_DEFS } from './dexie/schema-versions';
import { installValidationHooks } from './dexie/schema-hooks';
import { validateMigrationChain } from './dexie/migration-guard';

export const REDACTED_MARKER = '[REDACTED]';

export interface QueryResult<T> {
    rows: T[];
    affectedRows: number;
}

export type { RecordedEventRow };
import type { RecordedEventRow } from './dexie/recorded-event-row';

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
    agentRepositories!: Table<AgentRepository>;
    // Phase 2 — AGEMS Tasks
    agemsTasks!: Table<AgemsTask>;
    taskComments!: Table<TaskComment>;
    labels!: Table<Label>;
    taskLabels!: Table<TaskLabel>;
    taskWorkProducts!: Table<TaskWorkProduct>;
    taskTriggers!: Table<TaskTrigger>;
    // Phase 3 — AGEMS Approvals
    approvalPolicies!: Table<ApprovalPolicy>;
    approvalRequests!: Table<ApprovalRequest>;
    // Phase 4-5 — AGEMS Budgets & Meetings
    platformBudgets!: Table<PlatformBudget>;
    budgetIncidents!: Table<BudgetIncident>;
    meetings!: Table<Meeting>;
    meetingDecisions!: Table<MeetingDecision>;
    // Phase 8 — AGEMS Catalog
    catalogAgents!: Table<CatalogAgent>;
    catalogSkills!: Table<{ id?: number; slug: string; name: string }>;
    catalogTools!: Table<{ id?: number; slug: string; name: string }>;
    // Phase 9 — AGEMS Audit
    auditLogs!: Table<AuditLog>;

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
    projectFiles!: Table<ProjectFile, [string, string]>;
    projectArtifacts!: Table<ProjectArtifact>;
    projectAssignments!: Table<ProjectAgentAssignment>;

    constructor() {
        super('super_agents_os_v4');

        // P-LOW-4, documented: pre-v5 databases under the old DB name are
        // NOT migrated into this schema (only API keys travel via
        // key-migration.ts). Sessions/memories/notes from the old DB stay
        // orphaned in the browser profile. A full migration is a product
        // decision (one-shot importer UI), not a silent background copy.

        for (const def of DEXIE_VERSION_DEFS) {
            const version = this.version(def.version).stores(def.stores);
            if (def.upgrade) version.upgrade(def.upgrade);
        }

        installValidationHooks(this);

        validateMigrationChain(DEXIE_VERSION_DEFS);
    }
}
