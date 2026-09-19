# 01_CURRENT_STATE — What `agent-network` actually does now

> Research-only. Most machinery is SHARED infra; this agent has **no unique backend code**. Honest assessment below.

## How it is created / registered (VERIFIED)

- **Seeded** as a topology node in `topology-defaults.ts:145-155`, identity normalized from `AGENT_PROFILES` at `topology-defaults.ts:91-119`.
- **Registered as a runtime agent** implicitly: `AgentService` (`agent-service.ts:71`) reads the active topology's `agent`/`router` nodes via `getAgents()` (`:306`) and `resolveAgent()` (`:337`). There is no per-agent constructor or registration; the node _is_ the agent.
- `AgentService` is registered in `phase4-agents-roles.ts:86` (per AGENTS.md). Lifecycle/health listeners are wired in `agent-service.ts:175-256`.

## How it is selected / called (VERIFIED)

- **Debate:** added as a `ParticipantConfig` by the debate config/builders. The executor (`debate-agent-executor.ts:38-117`) looks up the participant by `nodeId` and calls the LLM with the participant's stored system prompt. Its side (pro/con/neutral) is whatever the debate config assigns (`debate-prompt-builder.ts:674`); the invocation delegate hard-codes `role: 'neutral'` for debate mode (`phase21-invocation.ts:81`).
- **ConversationCore / Director:** `ChatExecutionEngine.execute()` resolves the participant via `agentResolver.resolveAgent(participantId)` and injects `agent.systemPrompt` as a system message + `agent.model` as the request model (`conversation-execution-engine.ts:40-73`). So Nadia speaks with the network-engineer prompt and groq/llama-3.3-70b-versatile.
- **Invocation:** `RoomPanel` collects the human's agent pick -> `invocationEngine.invoke({ target:{agentId:'agent-network'}, ... })` (`RoomPanel.tsx:121-141`). `InvocationEngineService.resolveAgents` returns `[{id:'agent-network'}]` (`invocation-engine-service.ts:158-162`). The execution delegate then runs chat/director-scenario (`phase21-invocation.ts:89-108`) or debate (`phase21-invocation.ts:75-87`).

## Prompts / persona (VERIFIED)

- Single system prompt (topology-defaults.ts:150), temperature 0.2, no tools. No role-specific prompt variants, no specialization-aware prompting.
- The debate `PersonaSelector` (`persona-selector.ts:251-309`) chooses a generic PersonaVariant (e.g. `technologist`, `cautious_scientist`) by **topic keywords + the assigned role**, never by the agent's `specializations`. So Nadia's TCP/IP/SDN expertise is invisible to persona selection.

## Models / services available (VERIFIED)

- Model: groq `llama-3.3-70b-versatile` (from profile; applied by normalizeAgentIdentity). In `ChatExecutor`, `provider:'auto'` is resolved by the router; the request carries `model: agent.model` (`conversation-execution-engine.ts:73`) so the pinned model is honored in ConversationCore. In debate, the provider/model come from the debate key pool / participant config.
- Services it can transitively use: ChatExecutor, EventBus, KeyService, PolicyService, PromptSecurityService, CacheService, BudgetService, RouterService (all via `ChatExecutor` deps, `chat-executor.ts:1-28`). It has **no tools** (`tools: []`), so it cannot call MCP/code tools.

## Events in / out (VERIFIED)

- **In:** none targeted _at_ `agent-network` by id except the generic participant dispatch in debate/conversation.
- **Out (as a producer of signals):** it emits no events itself. Its LLM turns emit `MESSAGE_RESPONSE` / `STREAM_*` / `STREAM_END` via `ChatExecutor` (`chat-executor.ts:472,513`), carrying `agentId` in `options.metadata` (`chat-executor.ts:121`). It does NOT emit cognitive events during debate (debate path does not emit `cognitive:*` - AGENTS.md; confirmed no cognitive emit in `debate-agent-executor.ts`).
- **Consumed stats:** `AgentService` updates its per-agent stats on `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`) and `STREAM_END` (`agent-service.ts:219`). `AgentJournalService` records on `COGNITIVE_STEP_ACTIVE`/`COMPLETED` and `debate:runtime:agent:error` (`agent-journal-service.ts:130,150,174`).

## Debate / Conversation / Invocation / Research / Memory / Cognitive participation (VERIFIED + INFERRED)

- **Debate:** participant only; side set by config; no specialization-aware behavior. Contributes to `debate:runtime:agent:error` journal entries on failure.
- **ConversationCore:** full participant with persona+model injection. Emits `COGNITIVE_STEP_COMPLETED` (via the orchestrator) -> stats + journal (INFERRED: only when a cognitive step runs through the orchestrator, not via raw chat).
- **Invocation:** human-invokable (chat/debate/director-scenario). Yes.
- **Research / Knowledge / Crystal / Forum / Workflow / Scheduler:** cross-cutting services; `agent-network` has **no agent-specific** participation. It can appear as a Forum author if it posts (Forum `AuthorBadge`), but nothing seeds network-specific research/knowledge flows.
- **Memory:** generic memory stores (`episodic-memory.ts:53`, `social-memory.ts:33`, `service-backed-memory.ts:46`) support `query.agentId` filtering, but there is **no automatic, agent-network-specific memory write**. The only per-agent durable record is the **Agent Journal** (`agent-journal-service.ts`), keyed by `agentId`, populated from cognitive/debate events. No semantic/episodic memory is seeded for Nadia.
- **Cognitive stream:** visible only via `COGNITIVE_STEP_COMPLETED` (stats + journal). `cognitive:decision:made` is emitted system-wide but is dead-at-consumer (AGENTS.md). Debate does not emit cognitive events.

## UI representation (VERIFIED)

- Card/avatar via `AgentAvatar.getAgentAvatar` deterministic fallback + canonical emoji `🌐`/`#06b6d4` from `resolveAgentIdentity` (`agent-identity.ts`). Shown in `AgentsPanel`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, and consumed by Debate/Director/Forum/Dashboard (AGENTS.md).
- In `RoomPanel` it appears in the agent `<select>` built from `agentService.getAgents()` (`RoomPanel.tsx:89-95`).
- Status badge from `AgentService` lifecycle (`ready`/`busy`/`idle`/`paused`/`terminated`).

## Special settings (VERIFIED)

- `temperature: 0.2` (deliberately low - analytical persona), `tools: []`.
- No `lensIds`, no group membership, no auto-spawn clone tagging beyond generic `AgentService.autoSpawnConfig` (`agent-service.ts:81-86`).

## Honest bottom line

`agent-network` is a **data-defined agent**: its entire behavior is one system prompt + one pinned model + identity metadata. All "intelligence" (debate rounds, conversation turns, invocation, stats, journal, health) is supplied by shared services keyed by its node id. **There is no Nadia-specific orchestration, memory, lens, side-assignment, or cognitive visibility beyond what any other node gets.**
