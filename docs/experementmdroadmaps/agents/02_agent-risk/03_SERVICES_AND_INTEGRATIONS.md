# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI

> Map of how `agent-risk` flows through the system. All integrations REUSE existing
> infrastructure; no new engines required.

```
agent-risk (topology node + AGENT_PROFILES)
   │
   ├─ AGENT_SERVICE (IAgentResolver) ─────────────── phase4-agents-roles.ts:86
   │     ├─ resolveAgent → ResolvedAgent (prompt, model=auto, role)   agent-service.ts:337
   │     ├─ getAgents → RoomPanel picker                          RoomPanel.tsx:91
   │     ├─ getStats / lifecycle / groups                         agent-service.ts
   │     └─ consumes COGNITIVE_STEP_COMPLETED + STREAM_END → stats agent-service.ts:184,219
   │
   ├─ AGENT_IDENTITY (agent-identity.ts) ──────────── UI identity (avatar, lens, provider)
   │     └─ AgentIdentityView → Debate/Director/Forum chips
   │
   ├─ PROMPT_AUDIT (prompt-audit-service.ts:28) ───── 'Analytical' group
   │
   ├─ DEBATE_RUNTIME ──────────────────────────────── debate-api.ts:299-321
   │     ├─ resolveParticipants (positional side)     debate-api.ts:307
   │     ├─ persona-selector (topic keyword)         persona-selector.ts
   │     ├─ debate-knowledge-sync → memoryService    debate-knowledge-sync.ts:60,84
   │     └─ emits debate:* events (no agent-specific)
   │
   ├─ CONVERSATION_CORE / DIRECTOR ────────────────── resolveAgent → ChatExecutor
   │     └─ conversation:* events → DirectorStore
   │
   ├─ INVOCATION_ENGINE ───────────────────────────── phase21-invocation.ts
   │     ├─ AgentResolverDirectory wraps agentService
   │     ├─ InvocationEngineService.invoke            invocation-engine-service.ts:39
   │     └─ invocation:* events → invocationStore → RoomPanel
   │
   ├─ MEMORY (episodic/social/semantic/...) ───────── agentId-filterable, NOT auto-loaded
   │     episodic-memory.ts:53, social-memory.ts:33
   │
   └─ AGENT_JOURNAL (agent-journal-service.ts) ────── generic, queryable by agentId
         AgentJournalPanel.tsx

STORAGE: Dexie KV (stats/groups, agent-service.ts:68-69); topology (node config);
         memory stores; journal table; debate tables; invocation tables (v20).

UI SURFACES: AgentsPanel (card/detail/stats/elo/live), DebateRuntimePanel,
             DirectorPanel (AgentIdentityChip), ForumPanel (AuthorBadge),
             Dashboard (AgentLiveBoard), RoomPanel, AgentJournalPanel.
```

## Explicit Assessments

### Agent → Debate (VERIFIED)

- Integrated via `debate-api.resolveParticipants`. Side is **positional** (`roleOrder[i%3]`), NOT specialization-aware. Persona is topic-keyword driven, not risk-driven. **Gap:** a "Risk Analyst" can be assigned `pro` on a topic where risk mitigation is the `con` argument. Assessment: WORKS but MIS-MAPPED.

### Agent → Cognitive (VERIFIED / DEAD)

- Emits `COGNITIVE_STEP_COMPLETED` (stats only). `cognitive:decision:made` emitted but dead consumer (event-recorder.ts:232,261 skip; no handler). Assessment: PARTIAL — step visibility works, decision visibility dead.

### Agent → Memory (VERIFIED / INFERRED)

- Memory stores support agentId queries but nothing auto-loads agent-risk memory into its turns. Debate writes global memory. Assessment: EXISTS-BUT-UNUSED for agent-specific continuity.

### Agent → Invocation (VERIFIED)

- Full human invocation path via RoomPanel + `Manual Room Chat` policy. Assessment: WORKS (proven E2E in phase21).

### Agent → Research (N/A)

- No research subsystem binding. INFERRED: agent-risk could be a research participant but has no research-specific tooling.

### Agent → Workflow (PARTIAL)

- Topology node can be included in Builder workflows; no risk-specific workflow step.

### Agent → Knowledge / Crystal (POTENTIAL)

- `crystal-debate-bridge` auto-proposes crystals from debate verdicts (generic). No risk-tagged crystal path.

### Agent → Forum (VERIFIED)

- Authors forum posts via `AuthorBadge`. No risk-specific forum behavior.

### Agent → Scheduler (N/A)

- No scheduler trigger bound to agent-risk.

### Agent → ConversationCore (PARTIAL)

- Participates if a Director scenario lists it; otherwise dormant. Resolves through `resolveAgent`.

## Reuse summary

Every integration reuses existing services/events/storage. **No new engine is warranted** for basic participation. Agent-specific VALUE (see 11/13) comes from _wiring existing pieces together_ (persona variant, memory auto-load, decision surfacing, scheduler policy), not new infrastructure.
