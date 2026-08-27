# 03_SERVICES_AND_INTEGRATIONS — Agent → Service → Event → Storage → UI → Other agents

> Map of how `agent-security` flows through the system. VERIFIED by file:line; reused shared infra noted.

## Service dependency graph

```
agent-security (topology node, topology-defaults.ts:194)
   │
   ├─ AgentService (agent-service.ts:71, IAgentResolver)
   │     resolveAgent() → ResolvedAgent {model, provider, specializations, avatar}
   │     getAgents() → listed in AgentsPanel, DebatePanel, RoomPanel
   │     getStats()/record → Dexie KV super_agents_agent_stats
   │     lifecycle/autoSpawn → AGENT_LIFECYCLE_CHANGE, AGENT_HEALTH_CHANGE
   │
   ├─ agent-identity.ts (resolveAgentIdentity)  → AgentAvatarService + lens-engine + PROVIDER_DISPLAY_NAMES
   │     UI: AgentCard, AgentDetailPanel, AgentIdentityChip, DebateChat, VotePanel, HistoryItem
   │
   ├─ Debate runtime (when selected as participant)
   │     DebatePanel.tsx:232-252  builds ParticipantConfig {provider:nvidia, modelId:meta/llama-3.3-70b-instruct, systemPrompt}
   │     → debate-agent-executor.ts → debate-llm-caller.ts (routerService/providerResolver, retries, failover)
   │     Events OUT: debate:argument, round:*, agent:responded/error, DEBATE_CONSENSUS
   │     Storage: debate sessions (Dexie), usage via keyService
   │
   ├─ ConversationCore / Director (when scenario participant)
   │     ConversationDirectorService → ConversationOrchestrator → ChatExecutionEngine
   │     → agentService.resolveAgent(id) for persona+model (agent-service.ts:337)
   │     → ChatExecutor (chat-executor.ts) → LLM adapters
   │     Events OUT: conversation:turn:start/complete/error, conversation:completed (event-registry.ts)
   │     Storage: conversationScenarios (Dexie v19)
   │
   ├─ Invocation Engine (human Room)
   │     phase21-invocation.ts: AgentResolverDirectory(adapter over agentService)
   │     InvocationEngineService.invoke → InvocationExecutionDelegate.start
   │        → mode 'chat' → ScenarioRepository.create + conversationDirector.run
   │        → mode 'debate' → debateService.startDebate (role 'neutral')
   │     Events OUT: invocation:requested/accepted/rejected/executing/done (event-registry.ts)
   │     Storage: invocations + invocationPolicies (Dexie v20)
   │
   ├─ AgentJournalService (agent-journal-service.ts)
   │     subscribe: COGNITIVE_STEP_ACTIVE, COGNITIVE_STEP_COMPLETED, debate:runtime:agent:error
   │     Storage: agent_journal_v1 (Dexie KV)
   │
   └─ (Observability) AgentService stats ← COGNITIVE_STEP_COMPLETED + STREAM_END (agent-service.ts:184,219)
```

## Assessment of each integration

### → Debate (VERIFIED, USED)

Fully wired. `DebatePanel` reads node provider/model and injects into participant config (`DebatePanel.tsx:232-252`). Side/role assigned by debate topology (pro/con/neutral). Persona injection via `persona-selector.ts` is **topic-keyword based** and has **no security/red-team variant** (VERIFIED — 10 variants, none security). So `agent-security` speaks with a generic role persona unless topic keywords (law/policy/risk) happen to match `legal_expert`/`pragmatic_economist`.

### → Cognitive stream (PARTIAL)

`agent-security` emits `COGNITIVE_STEP_COMPLETED` on the **ConversationCore/Chat** path (`cognitive-service.ts:421` uses node systemPrompt). On the **Debate path it does NOT** (debate runtime emits `debate:*`, never `cognitive:*`). Consequence: AgentService stats + AgentJournal for `agent-security` are **incomplete for debate activity** (VERIFIED by shared context + code paths).

### → Memory (PARTIAL)

Agent journal records exist (`agent-journal-service.ts`). No agent-private semantic memory; identity persisted only via topology config. No cross-session continuity of prior security findings (INFERRED).

### → Invocation (USED)

Human can invoke `agent-security` from RoomPanel; `Manual Room Chat` policy matches `human-mention` and lets any registered agent be chosen (`phase21-invocation.ts:125-143`). No agent-initiated invocation (by design, D6).

### → Research (POTENTIAL / N/A)

No integration. `research-adapters` are domain-agnostic; `agent-security` is never auto-summoned by research flows.

### → Workflow / Builder (POTENTIAL)

`builder-agent-service` compiles topologies into flows; a workflow _could_ include `agent-security` as a node, but there is no security-scan step type bound to it (INFERRED).

### → Knowledge / Crystal (POTENTIAL)

`knowledge-generator-service.ts:32` lists `'security'` as a source domain and `crystal-types.ts:17` includes `'security'` domain, but these are **content tags**, not agent invocations. No automatic `agent-security` participation in crystallizing security knowledge (INFERRED — no bridge found).

### → Forum (N/A)

Forum is human/agent-posted; `agent-security` does not auto-post. Could be invoked to moderate/audit (POTENTIAL).

### → Scheduler (POTENTIAL / N/A)

No scheduler service referencing agents found in repo (INFERRED). No periodic security-scan trigger exists.

### → ConversationCore (USED)

Same machinery as Director. `agent-security` can be a turn participant; resolved via `agentService.resolveAgent`.

## Other agents it touches

- **Sibling technical agents** in default topology: `agent-architect`, `agent-devops`, `agent-database`, `agent-perf` (`topology-defaults.ts:183-239`) — connected through the router/aggregator, not directly to `agent-security`.
- **Security-adjacent**: `agent-risk` (STRIDE/DREAD/FAIR), `agent-ethics` (bias/ethics). No predefined group/team bundles them (VERIFIED — no seeding).

## Reuse summary

`agent-security` reuses 100% shared infra: `AgentService`, `agent-identity`, `AgentAvatarService`, `lens-engine` (available, unused), `debate-*`, `ConversationOrchestrator`, `ChatExecutor`, `InvocationEngineService`, `AgentJournalService`, Dexie KV. **Zero agent-specific code.** Every enhancement must therefore be expressed as (a) node-config enrichment, (b) shared-service extension keyed by agent id/role/domain, or (c) new generic capability that `agent-security` benefits from by tag.
