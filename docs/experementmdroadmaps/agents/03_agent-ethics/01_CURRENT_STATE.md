# 01 — CURRENT STATE: what `agent-ethics` ACTUALLY does now

> Honest, shared-infra view. The agent has **no bespoke machinery** — it is a generic topology node whose behavior is entirely the union of the shared agent/debate/conversation/invocation infrastructure.

## Registration & lifecycle (VERIFIED)

- Defined as a node in the default topology (`topology-defaults.ts:169-179`), identity enriched by `normalizeAgentIdentity` (`topology-defaults.ts:91-119`).
- Registered as a resolvable agent via `AgentService` (`agent-service.ts:71`, `IAgentResolver`), resolved from the active topology node (`resolveAgent`, `:337`).
- Lifecycle tracked in `AgentService.lifecycleStates` via `AGENT_LIFECYCLE_CHANGE` / `AGENT_HEALTH_CHANGE` (`:245-254`). Toggle/pause/resume/restart all operate on it generically (`:460-515`).
- Auto-spawn/cloning treats it like any other node (`:614-665`); it can be auto-cloned under load.

## How it is called (VERIFIED)

- **Prompt/persona**: the node system prompt ("You are an ethics officer…") plus `temperature: 0.2`. No tools. No lens. (VERIFIED)
- **Model/provider**: nvidia / `meta/llama-3.3-70b-instruct` (enforced by normalization). There is **no ethics-specific prompt engineering** beyond the one system-prompt sentence.
- **Execution seam**: when invoked, the caller resolves the node (`resolveAgent`) and the umbrella orchestrator runs the LLM with that system prompt + model. Debate uses `debate-agent-executor.ts` → `callLLM`; ConversationCore uses `ChatExecutor` → `conversation-execution-engine.ts:40`.

## Events in / out (VERIFIED)

- **Out (as a participant)**:
  - Debate path: emits `debate:runtime:agent:thinking`, `debate:runtime:agent:chunk`, `debate:runtime:agent:response`, `debate:runtime:agent:error` (from `debate-orchestrator.ts` generator, e.g. `:198-267`). **Does NOT emit any `cognitive:*` event.** (VERIFIED — no `COGNITIVE_` emit in `debate-runtime`; confirmed by grep.)
  - ConversationCore/Director path: the underlying topology orchestrator emits `COGNITIVE_STEP_ACTIVE` / `COGNITIVE_STEP_COMPLETED` (consumed by `AgentService` stats `:184-210` and `AgentJournalService` `:129-191`). Director also emits `conversation:*` lifecycle events (B4). (VERIFIED — AGENTS.md B4)
- **In**: none agent-specific.

## Debate participation (VERIFIED + INFERRED)

- Generic participant. Side (`pro`/`con`/`neutral`) is assigned by the debate creator, **not** derived from its ethics specialization. (VERIFIED — no specialization→side mapping; `persona-selector.ts` keys only on role + topic keywords.)
- `PersonaSelector` (`persona-selector.ts`) may pick `passionate_advocate` (trigger "ethical"/"moral"/"fair"…), `legal_expert` ("policy"/"regulation"…), or `philosopher` ("ethics"…) **for any agent** when topic keywords match — this is topic-driven, not agent-driven. (VERIFIED)
- Shared debate machinery it benefits from incidentally: `bias-profiler.ts` (cognitive-bias detection), `ethical_framework` / `ethical_evaluation` constraints (`debate-prompt-constants.ts:37,55`), `expert-ethics` witness (`expert-witness-service.ts:35`). **None are bound to `agent-ethics`** — any debate can use them. (VERIFIED)
- Result: in a debate, Elena speaks _as a generic participant whose only ethics flavor is her one-line system prompt_. There is no enforcement that she actually applies ethical frameworks, audits bias, or produces a responsible-alternatives deliverable.

## ConversationCore / Director participation (VERIFIED/INFERRED)

- A scenario turn assigned to `agent-ethics` is spoken by the resolved persona (system prompt + nvidia model) via `ChatExecutor`. (VERIFIED — `conversation-execution-engine.ts:40`, AGENTS.md B3/B4)
- Fully visible in the cognitive stream + AgentService stats + AgentJournal when run this way.

## Invocation participation (VERIFIED)

- `RoomPanel` lists it among `agentService.getAgents()`; a human picks "Elena Marchetti — Ethics Officer" and the "Manual Room Chat" policy (source `human-mention`) allows any registered human-selected agent. (VERIFIED — phase21-invocation seeded policy, AGENTS.md Step 6 manual policy)
- `InvocationEngineService` resolves it via `AgentResolverDirectory` → `agentService.resolveAgent`; rejects unknown ids. (VERIFIED — `invocation-engine-service.ts:77,158`)

## Research / Knowledge / Crystal / Forum / Workflow / Scheduler participation (INFERRED)

- No special wiring. It participates in these systems **only when explicitly added as a participant** (debate, scenario, invocation, group). There is no automatic ethics-review hook into Crystal formation, Forum consensus, Workflow deployment, or scheduling. (INFERRED — no references found; shared infra is opt-in)

## Memory & context (VERIFIED)

- `AgentJournalService` (`agent-journal-service.ts`) records an entry per `agentId` on `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`, and `debate:runtime:agent:error` (`:129-191`). So Elena accumulates journal entries, but:
  - They are keyed by raw `nodeId` (not display name) and `agentName` is set to the node id (`:135,161,179`) — the journal shows `agent-ethics`, not "Elena Marchetti".
  - `tags: []` — no ethics-specific tagging.
  - Debate-error entries are recorded, but normal debate success is **not** journaled (only errors via `debate:runtime:agent:error`). (VERIFIED)
- No dedicated long-term memory store for the agent beyond the shared journal + AgentService stats KV. (INFERRED)

## UI (VERIFIED)

- Appears as an `AgentCard` in AgentsPanel; detail via `AgentDetailPanel`; editable via `AgentIdentityEditor`; cloneable via `AgentWizard`. Avatar 🛡️/`#a855f7` resolved through `resolveAgentIdentity` → `AgentAvatarService` (NOT the deterministic `getAgentAvatar` fallback in `AgentAvatar.tsx:47`, which would hash to a different glyph). (VERIFIED — `agent-identity.ts:100-114`)
- Surfaces in DebateAnalytics, Dashboard/AgentLiveBoard, AgentComparison, Forum AuthorBadge, Director AgentIdentityChip, DebateRuntime AgentControlPanel.

## Settings (VERIFIED)

- Configurable through the shared editor: `prompt`, `temperature`, `tools`, `model`, `roleName`, specializations, avatar. Default `tools: []` triggers a prompt-audit "no tools assigned" suggestion (`prompt-audit-service.ts:192-198`). (VERIFIED)
