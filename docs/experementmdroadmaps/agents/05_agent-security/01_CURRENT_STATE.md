# 01_CURRENT_STATE — What `agent-security` ACTUALLY does now

> Honest, shared-infra view. VERIFIED = file:line. INFERRED = reasoned. Agent is a topology NODE; behavioral machinery is SHARED infra, not agent-specific.

## Registration & lifecycle (VERIFIED)

- Node defined in `topology-defaults.ts:194-205`; identity merged by `normalizeAgentIdentity` (`topology-defaults.ts:91-119`).
- `AgentService` (`agent-service.ts:71`) implements `IAgentResolver`; `getAgents()` enumerates topology nodes of type `agent|router` (`agent-service.ts:306-329`). `agent-security` appears because it is a node.
- Stats persisted to Dexie KV `super_agents_agent_stats` (`agent-service.ts:68`), loaded on init (`agent-service.ts:133-145`), debounced persist (`agent-service.ts:158-173`).
- Lifecycle states (`ready/paused/busy/idle/initializing/terminated`) tracked in `lifecycleStates` map (`agent-service.ts:77,588-594`). Auto-spawn clones busy agents (`agent-service.ts:614-665`) — `agent-security` can be auto-cloned.

## How it is selected / called (VERIFIED / INFERRED)

1. **Mission flow (default topology)**: edge `router → agent-security` (`topology-defaults.ts:468`). INFERRED: the Mission Router classifies an incoming task and routes to this node; then `agent-security → aggregator` (`:520`). This is the primary "automatic" path, but only when the default topology is mounted.
2. **Debate**: `DebatePanel` builds participant config from the node: `provider: node.config.provider` (`'nvidia'`), `modelId: node.config.model` (`'meta/llama-3.3-70b-instruct'`), and a `systemPrompt` composed from archetypes/role (`DebatePanel.tsx:232-252`; `DebateTabContent.tsx:264-269`). Execution via `debate-agent-executor.ts` → `debate-llm-caller.ts`.
3. **ConversationCore / Director**: scenario participant referenced by id; `ChatExecutionEngine`/`ConversationDirectorService` resolve the agent via `agentService.resolveAgent` (`agent-service.ts:337-390`) for persona + pinned model.
4. **Invocation (Room)**: human selects `agent-security` from `AgentService.getAgents()` in RoomPanel; `InvocationEngineService.invoke` → `AgentResolverDirectory` (`phase21-invocation.ts:44-58`) → `InvocationExecutionDelegate.start` (`phase21-invocation.ts:61-110`) hands off to Director (chat) or Debate.
5. **Agent journal**: `AgentJournalService` records `agent-security` entries from `COGNITIVE_STEP_ACTIVE`/`COGNITIVE_STEP_COMPLETED`/`debate:runtime:agent:error` (`agent-journal-service.ts:129-191`).

## Prompts / persona (VERIFIED)

- **Runtime system prompt** = the static topology `prompt` (`topology-defaults.ts:200`): "You are a security engineer. Identify threats, attack vectors, and security gaps. Apply defense-in-depth and least-privilege principles. Use STRIDE and OWASP Top 10."
- **Curated specializations** (Threat Modeling, AppSec, Zero Trust) are stored in `node.config.specializations` but are **NOT injected into the system prompt** (grep confirms `specializations` is never concatenated into a prompt — see 03/10). They appear only as UI metadata and as Invocation matching hints.
- **Name "Yara Haddad"** is UI-only (`resolveAgentIdentity`, `agent-identity.ts:129-143`); the LLM never sees it.

## Model / provider (VERIFIED)

- After normalization: `provider='nvidia'`, `model='meta/llama-3.3-70b-instruct'` on the node config (`topology-defaults.ts:104-105`).
- Honored in Debate path (`DebatePanel.tsx:232-252`).
- For ConversationCore path, `resolveAgent` returns `model`/`provider` (`agent-service.ts:352-353,387`) which the Director's ChatExecutor path can use; INFERRED the same nvidia model is used (ChatExecutor resolves via `routerService`/`providerResolver` when `req.provider` is unset — `chat-executor.ts:201-209`; the agent's pinned provider is applied only where `req.provider`/`agentId` policy is consulted — `chat-executor.ts:121-141`).

## Events in / out (VERIFIED)

- **In (consumes)**: `COGNITIVE_STEP_COMPLETED` (stats), `STREAM_END` (provider stats), `AGENT_LIFECYCLE_CHANGE`, `AGENT_HEALTH_CHANGE` (auto-spawn) — `agent-service.ts:175-255`.
- **Out (emits)**: `AGENT_LIFECYCLE_CHANGE`, `AGENT_RESTARTED`, `SYSTEM_NODE_SPAWN/REMOVED` — `agent-service.ts:603,514,428,455`. As a participant it emits `DEBATE_ARGUMENT`/round events via the debate runtime (not agent-owned).
- **Cognitive stream**: agent-security contributes to `COGNITIVE_STEP_COMPLETED` only on the **ConversationCore/Chat path** (`cognitive-service.ts:421` uses `node.config.systemPrompt`). **Debate path emits NO cognitive events** (VERIFIED by shared context; `debate-llm-caller.ts` emits `debate:*` not `cognitive:*`). => Reduced observability during debates (see 10).

## Memory (VERIFIED / INFERRED)

- **Agent journal**: `agent_journal_v1` KV, entries keyed by `nodeId` (`agent-journal-service.ts:36,41-80`). `agent-security` recorded on cognitive steps + debate errors.
- No agent-private long-term memory store specifically for `agent-security`. ~16 memory stores exist in the system but are not agent-scoped to this node (INFERRED — none reference `agent-security`).
- `specializations`/`baseRole` are persisted in topology config (Dexie via `AgentService.updateAgent`) — that is the only "memory" of its identity.

## UI (VERIFIED)

- `AgentsPanelView` → `AgentCard` (`AgentsPanelView.tsx:344,374`); `AgentDetailPanel` with tabs: Config, Observability, Infra, Handoffs, Capabilities (`AgentDetailPanel.tsx`, `AgentConfigTab`, `AgentObservabilityTab`, `AgentInfraTab`, `AgentHandoffsTab`, `AgentCapabilitiesTab`).
- `AgentAvatar` shows 🛡️ `#10b981` (`AgentAvatar.tsx:47,68-120`).
- Shown as `AgentIdentityChip` in Director `RunTab`/`ParticipantsField` (`DirectorPanel/AgentIdentityChip.tsx:18`).
- Debate identity resolved via `resolveAgentIdentity` in `DebateChat`, `DebateAnalytics`, `VotePanelSection`, `HistoryItem`, `CausalAnalysisSection`.
- Forum `AuthorBadge`, Dashboard `AgentLiveBoard`, `AgentComparisonPanel` may render it generically.
- **No agent-specific UI** — `grep "agent-security"` in `src/components` returns 0 hits; it is rendered purely through generic agent components.

## Settings / configurability (VERIFIED)

- Editable via `AgentIdentityEditor`/`AgentWizard` (generic). `temperature: 0.15`, `tools: SECURITY_TOOLS`, `model` default `'auto'` in source but overridden to `meta/llama-3.3-70b-instruct` by normalization.
- `AgentService` groups/teams: `createGroup`/`executeGroup` exist (`agent-service.ts:667-799`) but **no default group includes `agent-security`** (INFERRED — seeding not found in code).

## Honest summary (INFERRED/VERIFIED)

`agent-security` is a **fully-seeded, generic topology node** with a curated identity (name, avatar, model, specializations) that is well-rendered in UI and reachable via Router/Debate/Director/Invocation. Its **behavioral prompt is generic** and **does not use its specializations or name**; it has **no agent-specific services, memory, events, or UI**, and **no automatic participation** in Knowledge/Crystal/Forum/Workflow/Scheduler. Observability during debates is weaker than during ConversationCore runs.
