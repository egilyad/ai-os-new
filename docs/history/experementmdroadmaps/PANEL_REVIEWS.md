# PANEL REVIEWS (Phase 2)

Detailed records for the major user-facing panels. Long-tail experimental panels are
summarized in §Appendix. Format per instruction: Purpose / Capabilities / Backend used /
Backend NOT exposed / Workflow / UX / Density / Discoverability / Consistency /
Improvement opportunities / Potential features / Reuse / Priority / Effort.

> "Backend NOT exposed" = capability that already exists in a service/contract but the panel
> does not surface. Verified items marked [V]; inferred marked [i].

---

## DEBATE DOMAIN

### Panel: DebateArena (`debate`)

**Purpose:** Primary debate surface — configure, launch, and watch multi-agent debates.
**Capabilities:** Setup wizard (agents, topic, strategy, constraints), live argument stream,
round timeline, verdict panel, strategy selector, inject bar, quality metrics, related debates.
**Backend used:** `debateService` (singleton), `DebateSyncManager`, `debate-llm-caller`,
`debate-engine`, `DebateSessionHeader` (pause/resume/cancel).
**Backend NOT exposed [V]:** concurrent/parallel debates — `DebateSyncManager` is single-active
and cancels the previous session (nightly EB-15); forum→debate escalation absent (IN-01).
**Workflow:** Configure → Start → watch rounds → read verdict.
**UX:** Rich but dense; many sub-panels. Live updates can lag (lossy `debate:updated`, FE-08).
**Density:** High. **Discoverability:** Good within domain, but features split across 12 panels.
**Consistency:** Strong within Debate domain.
**Improvements:** (1) Show clearly when a new debate cancels a running one (EB-15 impact).
(2) Surface `DEBATE_UPDATED` reliably (fix emitOnce, EB-17). (3) One-click "escalate to debate"
from Forum (IN-01).
**Potential features:** debate templates library (contract `debate-templates` exists),
side-by-side compare of two debates, export verdict to Forum as case study.
**Reuse:** `DebateReplayPanel` (temporal-replay), `ArgumentGraphPanel`, `DebateAnalysisPanel`.
**Priority:** P1. **Effort:** M.

### Panel: DebateLivePanel (`debate-live`)

**Purpose:** Real-time streaming view of an active debate.
**Capabilities:** live argument chunks, participant status, round progress.
**Backend used:** `debateLiveStore`, `conversation:*`/debate events.
**Backend NOT exposed [i]:** fine-grained turn latency / per-agent token cost per live turn.
**Workflow:** Open during a run → watch.
**UX:** Good for live; no historical replay.
**Improvements:** link to DebateReplay for post-hoc analysis.
**Priority:** P2. **Effort:** S.

### Panel: DebateReplayPanel (`debate-replay`)

**Purpose:** Step-through a finished debate using `temporal-replay-service`.
**Capabilities:** timeline scrubber, event detail, sidebar, live controls.
**Backend used:** `temporal-replay-service`, `debate-engine` snapshots.
**Backend NOT exposed [i]:** annotation/export of replay segments; share as Forum case study.
**Improvements:** annotate + export (R-20).
**Priority:** P2. **Effort:** S.

### Panel: ArgumentGraphPanel (`argument-graph`)

**Purpose:** Visualize argument relations of a debate.
**Capabilities:** graph of claims/supports/attacks; subscribes `DEBATE_UPDATED`/`DEBATE_ARGUMENT`.
**Backend used:** debate events, debate-store.
**Backend NOT exposed [i]:** cross-debate graph (relations spanning multiple debates).
**Priority:** P2. **Effort:** M.

### Panel: DebateAnalysisPanel / DebateQualityPanel / QualityImpactDashboard

**Purpose:** Post-hoc analysis: quality metrics, impact, bias.
**Backend used:** `debate-quality`, `quality-impact`, `debate-vulnerability` contracts.
**Improvements:** connect quality verdicts to Forum consensus; surface in Agent profile.
**Priority:** P2. **Effort:** M.

### Panel: DebateWorkspacePanel / StrategyBuilder / TournamentPanel / TopicSuggesterPanel / AudiencePanel / DebatesManagerPanel / DebateHistoryPage

- **Workspace:** compose debates as workspaces; reuse `debate-workspace`.
- **StrategyBuilder:** build debate strategies (DSL); `debate-strategy-dsl` contract exists.
- **Tournament:** bracket view of debate tournaments (`TournamentBracketView`).
- **TopicSuggester:** suggest topics (reuse `topic-suggester`).
- **Audience:** audience archetypes (`audience-service`, `audience-archetypes`).
- **DebatesManager:** list/manage debates (subscribes DEBATE_SESSION_* events).
- **History:** historical debates page.
  **Improvements (collective):** unify these into a single "Debate Hub" with tabs (reduce the
  12-panel sprawl); add persistent history browser (R-15).

---

## CONVERSATION / DIRECTOR / ROOM

### Panel: DirectorPanel (`director`)

**Purpose:** Author and run scripted multi-agent conversations (ConversationCore).
**Capabilities:** Configure (scenario editor: participants, ordered turns, objectives,
constraints), Library (CRUD + duplicate + archive scenarios), Run (load/run/pause/resume/
skip/override/abort, progress, turn log).
**Backend used:** `conversationDirectorService`, `scenarioRepository`, `HybridPolicy`,
`ConversationOrchestrator`, `directorController`, `directorStore`.
**Backend NOT exposed [V]:** checkpoints are in-memory only — no persistence/history (IN-04);
live "executing" lifecycle honest? no (nightly EB-19/UX-05). Override hardcodes CHALLENGE (IN-05).
**Workflow:** Configure scenario → Save → Library → Run → watch turns → done.
**UX:** Clear 3-tab model; Run tab is the most complete. Good.
**Density:** Normal. **Discoverability:** Good. **Consistency:** Good within panel.
**Improvements:** (1) Persist + show run history/checkpoints (R-05). (2) Make Override objective
type selectable. (3) Fix checkpoint-list refresh staleness (nightly FE-09). (4) Deeper scenario
templates.
**Potential features:** scenario templates marketplace; "branch" a run; compare two scenario
outcomes; export transcript to Forum/Research.
**Reuse:** `RoomPanel` (invoke), `ForumPanel` (publish result), `ResearchPanel`.
**Priority:** P1. **Effort:** M.

### Panel: RoomPanel (`room`)

**Purpose:** Human invokes a registered agent into a Room → chat / debate / director-scenario.
**Capabilities:** agent picker, where (room/forum/conversation), mode, task; invocation list
with status; live output feed; open session (deep-link to director/debate); history (Dexie).
**Backend used:** `invocationEngine`, `agentService`, `invocationRepository`, `invocationStore`,
real ConversationCore/Debate via delegate.
**Backend NOT exposed [V]:** live feed unscoped (interleaves all sessions, FE-07); "Clear"
misleads (FE-06); status over-promises for debate (UX-05).
**Workflow:** Pick agent → pick mode → task → Invoke → watch → open session.
**UX:** Friendly, clear. Minor: feed confusion, clear semantics.
**Improvements:** scope feed by session (R-06); rename Clear or make destructive; tie status to
real execution; allow invoking a _workflow_ or _research_ (not just chat/debate/scenario).
**Potential features:** multi-agent rooms (several agents in one room); room persists as a
"channel" with history; schedule recurring invocations.
**Reuse:** `invocationEngine` (already the sole writer), `ForumPanel`, `DebateArena`.
**Priority:** P0. **Effort:** M.

### Panel: ChatPanel (`chat`)

**Purpose:** Direct chat with agents/models.
**Backend used:** `chatService`, `useChatStore`, MESSAGE_RESPONSE/STREAM_* events.
**Improvements:** link chats to Rooms/Invocations; bookmark/export (BookmarksPanel exists).
**Priority:** P2. **Effort:** S.

---

## FORUM

### Panel: ForumPanel (`forum`)

**Purpose:** Async persistent threads (topics, posts, voting, consensus).
**Capabilities [i from contract]:** view topics/threads, post messages.
**Backend used:** `forumService` (`IForumService`).
**Backend NOT exposed [V]:**

- `votePost` — implemented+tested, **no UI** (IN-02).
- `subscribe` / `pinTopic` — implemented, **no UI / display-only pin** (IN-03).
- `moderatePost` (warn/hide/remove) — **no UI**.
- `getConsensus` → "escalate to debate" — **no UI/bridge** (IN-01).
  **Workflow:** Browse topics → open thread → post. (No voting/moderation today.)
  **UX:** functional but minimal; feels read-only.
  **Density:** Low. **Discoverability:** weak (capabilities invisible).
  **Improvements (P0):** add vote buttons, subscribe toggle, pin control, moderator actions
  (warn/hide/remove), and a "Escalate to debate" action on contested topics (consensus low →
  launch Debate runtime). All backend-ready.
  **Potential features:** topic tags/categories, "agent answers this topic" via Invocation,
  consensus → Crystal (knowledge crystallization).
  **Reuse:** `invocationEngine` (escalate→debate), `crystalVault` (consensus→crystal),
  `debateService`.
  **Priority:** P0. **Effort:** M.

---

## COGNITIVE MODULES

### Panel: LensesPanel (`lenses`)

**Purpose:** Apply analytical "lenses" to content; stack lenses.
**Backend used:** `lensEngine`, `lens-library`.
**Improvements:** connect lens output → Synthesis/Crystal automatically.
**Priority:** P1. **Effort:** S–M.

### Panel: CrystalVaultPanel (`crystals`)

**Purpose:** Propose/validate/crystallize knowledge crystals (claims with confidence).
**Backend used:** `crystalVault`, `CrystalRepository`, crystal-debate-bridge.
**Improvements:** surface "crystals formed from debates/forum" feed; link to Forum topics.
**Priority:** P1. **Effort:** S.

### Panel: JunctionPanel (`junctions`)

**Purpose:** Detect conceptual junctions/contradictions across knowledge.
**Backend used:** `junctionEngine`, `JunctionRepository`.
**Improvements:** show junction → trigger a Debate (contradiction mined → debate).
**Priority:** P1. **Effort:** S–M.

### Panel: SynthesisPanel (`synthesis`)

**Purpose:** Multi-perspective synthesis (decompose → perspectives → zones → refine).
**Backend used:** `synthesisEngine`, `SynthesisRepository`.
**Improvements:** export synthesis → Crystal; publish as Forum topic; "research this gap".
**Priority:** P1. **Effort:** S–M.

### Panel: KnowledgeGenPanel (`knowledge-generator`)

**Purpose:** Autonomous knowledge generation → crystallize.
**Backend used:** `knowledgeGenerator`, `GeneratorRepository`.
**Improvements:** schedule periodic generation (scheduler-service); review queue UI.
**Priority:** P1. **Effort:** M.

**Cognitive composition opportunity (P1/M):** auto-bridge
Lenses → Synthesis → Crystal → Forum so analysis flows into durable, discussable knowledge
without manual copy-paste (R-09).

---

## AGENTS

### Panel: AgentsPanel (`agents`)

**Purpose:** Manage agents (create/edit/configure roles, models, constraints).
**Backend used:** `agentService`, `agent-identity`, `agent-version-service`.
**Improvements:** link to Invocation (invoke from here), show agent's journal/SRE inline.
**Priority:** P1. **Effort:** S.

### Panel: RolesPanel / RolesConsortiaPanel (`roles`, `roles-consortia`)

**Purpose:** Role definitions + consortia (teams of roles).
**Backend used:** `unified-role-service`, `role-team` contract.
**Backend NOT exposed [V]:** `ROLE_ASSIGNED` event emitted, no consumer (IN-07).
**Improvements:** consortia → reusable Invocation target (invoke a whole team).
**Priority:** P2. **Effort:** M.

### Panel: AgentMarketplacePanel (`agent-marketplace`)

**Purpose:** Browse/share agents (marketplace).
**Backend used:** `agent-marketplace` service (or template-sharing).
**Improvements:** import agent → AgentsPanel; one-click "invoke in Room".
**Priority:** P2. **Effort:** M.

### Panel: AgentJournalPanel (`agent-journal`) / SREAgentPanel (`sre`) / AgentComparisonPanel

- **Journal:** per-agent event log (`agent-journal-service`).
- **SRE:** advisor suggestions (`advisor-service`).
- **Comparison:** compare agents head-to-head.
  **Improvements:** unify into an **Agent profile/workspace** (R-10): registry + journal + SRE +
  marketplace + invoke.
  **Priority:** P2. **Effort:** M.

### Panel: GroupsPanel (`groups`)

**Purpose:** Group management (key groups / agent groups).
**Backend used:** `group-manager`.
**Improvements:** groups as Invocation targets.
**Priority:** P2. **Effort:** S.

---

## PROVIDERS / KEYS / ROUTING

### Panel: ProviderManager (`keys`)

**Purpose:** Manage API keys, providers, health, pools.
**Backend used:** `keyManagement` (key-service, key-registry, key-status, key-health),
`key-vault`, `pool-selector`, `ProviderManager` sub-tables (openrouter/groq/nvidia/overview).
**Improvements:** surface `KEY_COMPROMISED` as a proactive alert (R-18, IN-06); key-usage
analytics already a panel.
**Priority:** P1. **Effort:** S.

### Panel: SmartRoutingPanel (`smart-routing`) / RoutingIntelligence (`routing`)

**Purpose:** Configure routing rules / see routing intelligence.
**Backend used:** `SmartRoutingService` (panel) vs `RouterService` (live) — **disjoint** (EB-24).
**Backend NOT exposed [V]:** SmartRouting rules likely do NOT affect live `RouterService`
routing (EB-24).
**Improvements (P1/M):** bridge SmartRouting → live router (R-07), or clearly label as
"experimental/advisory".
**Priority:** P1. **Effort:** M.

### Panel: ProviderDashboard / GroqSpeedDashboard / OpenRouterPanel / NvidiaEnterprisePanel

**Purpose:** Provider-specific dashboards/panels.
**Improvements:** consolidate into tabbed Provider center; reduce panel count.
**Priority:** P2. **Effort:** S.

---

## RESEARCH

### Panel: ResearchEnginePanel / ResearchEngineAdvancedPanel (`research-engine`, `research-advanced`)

**Purpose:** Run epistemic research loops (search → extract → synthesize).
**Backend used:** `research-engine` (`IResearchEngine`).
**Backend NOT exposed [V, major]:** `IResearchEngine` has 12+ phases — systematic review
(PRISMA), fact-check, peer-review simulation, citation graph, knowledge graph, anomaly
detection, auto-discovery, multi-doc summarization, citation export — but the UI exposes only a
subset. **This is the single largest hidden-capability gap (R-01).**
**Workflow:** ask question → run loops → read synthesis.
**Improvements (P0/M):** add tabs/sections for Systematic Review, Fact-Check, Peer Review,
Citation Graph, Knowledge Graph, Anomaly Detection, Discovery — all backend-ready.
**Potential features:** "Debate this claim" from a research contradiction (R-14); export report
to Forum (ResearchReportPanel exists).
**Reuse:** `debateService` (bridge), `ForumPanel`, `CitationGraph`.
**Priority:** P0. **Effort:** M.

### Panel: ResearchReportPanel (`research-reports`) / DebateSystemResearch / HypothesisGenerator / ArchReview / PromptAudit / RoutingExperiments / GovStressTest / ObsGaps / ProjectOsExplorer

- **Report:** renders `ResearchReport` (sections, citations, peer review).
- **DebateSystemResearch / HypothesisGenerator:** research/debate topic ideation.
- **ArchReview / PromptAudit / RoutingExperiments / GovStressTest / ObsGaps:** deep
  introspection/experiment panels (very rich debugging/research tooling).
  **Improvements:** cross-link these research/introspection panels into a "Research & Analysis
  Workbench" hub.
  **Priority:** P2. **Effort:** M.

---

## WORKFLOWS / BUILDER

### Panel: WorkflowPanel (`workflows`)

**Purpose:** Multi-step LLM workflows (prompt chains with input mapping).
**Backend used:** `workflow-service`, `Workflow` type, 2 built-ins (code-review, ADR).
**Backend NOT exposed [i]:** run history, "save as template", schedule.
**Workflow:** pick/run workflow → see step results.
**Improvements (P1/M):** run history; template save/share (R-08); schedule via scheduler;
compose workflow outcome → agent/forum.
**Priority:** P1. **Effort:** M.

### Panel: CognitiveBuilder (`builder`)

**Purpose:** Prompt→topology generator + saved workflows (Builder agent).
**Backend used:** `builderAgent`, `WorkflowRepository`.
**Improvements:** "deploy" generated flow → WorkflowPanel; invoke flow from Room.
**Priority:** P1. **Effort:** M.

---

## KNOWLEDGE / MEMORY

### Panel: KnowledgePanel (`knowledge`) / MemoryPanel (`memory`) / MemoryPalacePanel (`memory-palace`)

**Purpose:** Knowledge base + memory store browsing.
**Backend used:** `knowledge` service, `memory-engine`, `MemoryRepository`.
**Improvements:** connect memory → agent context (already partly); surface memory in agent
profile; "crystallize memory into Crystal".
**Priority:** P1. **Effort:** S–M.

---

## OBSERVABILITY / DEBUG (already rich)

TracesPanel, LogsPanel, RouterTraceView, StateInspectorPanel, DiagnosticsPanel,
CausalDebugger, CounterfactualPanel, ShadowPanel, DependencyMapPanel, PerformanceProfilerPanel,
WhatIfPanel, PressureMap/RuntimePressure — collectively a **Level-3 debugging suite**.
**Improvements:** (1) unify into an "Observability" hub with saved views; (2) the `subscribeAll`
usages (DashboardPanel, LiveWorkspace) should be audited for necessity (nightly AR-08);
(3) surface key/system health alerts proactively (R-18).
**Priority:** P2. **Effort:** M.

---

## ANALYTICS / COST

AnalyticsPanel, PricingPanel, BudgetPanel, CostAnalyticsPanel, CostOptimizationPanel,
ABTestPanel, CustomMetricsPanel, KeyUsageAnalyticsPanel, HealthSlaPanel — good coverage.
**Improvements:** correlate cost to _agent/debate/workflow_ (already partially via key-usage);
add a per-invocation cost attribution.
**Priority:** P2. **Effort:** M.

---

## ADMIN / CONFIG

SettingsPanel, PoliciesPanel, PolicyEditorPanel, AuditLogView, ConfigHistoryView,
ServiceRegistryPanel — mature. **Improvements:** tie policy editor to Invocation policies
(`invocationPolicies`); show audit log filtered by entity.
**Priority:** P2. **Effort:** S.

---

## APPENDIX — experimental / long-tail panels (compact)

Many panels appear early/experimental; recommend validation before roadmap commitment:
`AquariumPanel`+`EcosystemDashboard`+`AquariumTradingPanel` (ecosystem/trading metaphor),
`CommunityHubPanel`, `PersonaMarketplacePanel`, `PersonaPickerPanel`, `PluginSdkPanel`,
`FederatedMemoryPanel`, `TemplateSharingPanel`, `MemoryTransferPanel`, `TimeMachinePanel`,
`ContributionGraphPanel`, `QuantumInspirationPanel`, `FineTuningPanel`, `DistillationPanel`,
`DeployPanel`, `MetaLearningPanel`, `GeminiResearchPanel`, `GoogleStudioPanel`,
`GoogleCachePanel`, `GeminiLivePanel`, `VoiceInputPanel`, `AgentProtocolPanel`, `SocialLeaderboardPanel`,
`TopicSuggesterPanel`, `DebateTemplatesPanel`, `HealthSlaPanel`, `BudgetAlertsPanel`,
`TopologyGalleryPanel`, `PromptVersionPanel`, `PromptLibraryPanel`, `BatchProcessingPanel`,
`PromptSecurityPanel`, `EditorsPanel`, `ConnectorsPanel`, `MCPPanel`, `PatternsPanel`,
`WorkspacePanel`, `SessionHubPanel`, `ChatSessionsManagerPanel`, `SessionBindingsPanel`,
`KeyNotesPanel`, `DecisionLogPanel`, `CachePanel`, `WebhooksPanel`, `RotationsPanel`,
`TutorialPanel`, `ExportImportPanel`, `AgentComparisonPanel`, `ModelComparePanel` (playground),
`SchedulerPanel`.
**Recommendation:** treat as a "labs" section; several are likely thin. Phase 17 / DO_NOT_BUILD
discusses pruning the ~30 `ComingSoon` placeholders.

---

_Next: SERVICE_REVIEW.md (Phase 4)._

---

## CYCLE 3+ ADDITIONS (2026-08-15)

Cycle 3 re-verified prior claims against current source and reviewed panels left thin or
marked "experimental." All new claims below are VERIFIED by grep on 2026-08-15.

### Re-verified dark corners (CONFIRMED)

- **SchedulerPanel is a mock** — renders hardcoded `SCHEDULES`; no `schedulerService.*` call.
  `SCHEDULE_TRIGGERED` emitted at `scheduler-service.ts:300` has **zero subscribers** → triggers die.
- **Forum backend rich, UI thin** — `votePost`/`subscribe`/`pinTopic`/`moderatePost`/`getConsensus`
  in `forum-service.ts` (149/195/237/245/262), no UI consumer.
- **Research engine** — 12-phase contract (`contracts/research-engine.ts`), only summary exposed;
  Fact-Check / Peer-Review / Citation-Graph / PRISMA phases dark in UI.
- **KeyManagement** — `KEY_COMPROMISED` emitted (`key-status.ts:174`, event-registry:44) but no
  UI subscriber (AlertLayer does not listen).

### Fresh mini-reviews (under-exposed panels)

1. **ForumPanel** — vote/subscribe/pin/moderate/getConsensus present, no UI. Low-cost: inline
   vote + subscribe + pin + moderator menu. Ambitious: "Escalate to debate" via Invocation → verdict
   back as case study (UX-009).
2. **SchedulerPanel** — mock; wire to `schedulerService.getAll()/createSchedule()`; bridge
   `SCHEDULE_TRIGGERED`→Invocation (UX-002).
3. **ResearchEnginePanel** — expose Fact-Check / Peer-Review / Citation-Graph tabs reusing contract
   returns; "Debate this claim" from any contradiction.
4. **KeyManagement (ProviderManager)** — subscribe AlertLayer to `KEY_COMPROMISED`/`KEY_EXPIRED`/
   rate-limited → banner; reuse existing events.
5. **Workflows/Builder** — Scheduler can't schedule workflows; Builder "Deploy" emits
   `builder:flow:deployed` into the void (no subscriber). Low-cost: wire deploy → WorkflowPanel list;
   "Schedule this workflow" via `schedulerService`.

### Unreviewed panel directories (exist, not in prior review) — one-liners

- **AddKeyModal** multi-step key import · **AlertLayer** global alert/banner (natural key-health home,
  currently unsubscribed) · **BookmarksPanel** save/search/tag chats/items · **ChatAdminPanel** /
  **ChatExportPanel** session admin + export · **DashboardPanel** landing (live board, mesh, health,
  usage heatmap, quick actions) · **DebateRuntimePanel** full runtime control (create/agent/topology/
  metrics/timeline) · **DocsHealthPanel** / **DocumentationPanel** docs health + in-app docs ·
  **EventsTimeline** EventBus visual timeline (26KB) · **HealthPanel** nodes/kernel/probe/score ·
  **KeyTable** deep per-key profile · **LiveCognition** "Mission Control" live cognition + event log ·
  **OnboardingWizard** first-run (welcome→connection→done) · **PoolStatusPanel** provider pool (42KB) ·
  **SkillsPanel** agent skills catalog (40KB) · **TasksPanel** task mgmt (35KB) · **ToolsPanel** tool
  catalog w/ inspector/sandbox/schema/security · **UsageHeatmap** usage viz.

**Pattern:** DashboardPanel + LiveCognition + EventsTimeline + HealthPanel + PoolStatusPanel +
KeyTable + AlertLayer already form a near-complete **live-ops cockpit** — currently scattered/siloed.
Big opportunity: compose them into one Mission-Control surface (see COMPOSITION_OPPORTUNITIES.md /
BIG_IDEAS.md).
