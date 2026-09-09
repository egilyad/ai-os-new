# 01_CURRENT_STATE — What `agent-creative` ACTUALLY does now

> Honest, shared-infrastructure view. No fabrication.

## The single most important fact

`agent-creative` is **not a self-contained "agent program."** It is a **topology node**
(`type: 'agent'`, id `agent-creative`) whose behavior is 100% provided by shared infra:

- Its **identity** (name, role, avatar, model, specializations) comes from
  `AGENT_PROFILES` merged into the node config by `normalizeAgentIdentity`
  (`topology-defaults.ts:91-119`).
- Its **execution** is the generic LLM call path: Orchestrator → `ChatExecutor`
  (`chat-executor.ts`) → provider. The only agent-specific input is the node's
  `prompt` ("You are a creative visionary…", `temperature: 0.8`) and its pinned model
  (`openrouter/meta-llama/llama-3.3-70b-instruct`).

So "what it does now" = "whatever the shared runtime does with that prompt + model,
when something routes a task to node `agent-creative`."

## Concrete current behaviors (VERIFIED)

1. **It can be a debate participant.** When a debate includes `agent-creative` in its
   participant list, the debate runtime executes that node's prompt/model
   (`debate-orchestrator.ts`, `debate-engine.ts`). Persona is chosen by _topic keyword_
   via `PersonaSelector` — NOT by its "Creative Visionary" role
   (`persona-selector.ts:243-290`). For a brand/ideation topic the persona may or may not
   align with creativity; it is keyword-driven.

2. **It can answer in a ConversationCore/Director chat.** `ChatExecutor` reads
   `req.options.metadata.agentId` (`chat-executor.ts:121`); when set to `agent-creative`
   the node's prompt/model shape the reply. The Director's `TurnProposal.participantId`
   resolves through `agentService.resolveAgent` (`conversation-execution-engine.ts:40`).

3. **It can be invoked by a human in RoomPanel.** Human picks it from the agent dropdown;
   `invocationEngine.invoke` → policy check → execution delegate → chat/director/debate
   (`phase21-invocation.ts:44-89`, `invocation-engine-service.ts:158-173`).

4. **It accrues stats.** Every completion emits `COGNITIVE_STEP_COMPLETED` (or
   `STREAM_END`) which `AgentService` tallies into per-node `AgentStats`
   (`agent-service.ts:184-210, 219-244`). Visible in `AgentStatsDashboard`,
   `EloLeaderboard`, `AgentComparison`.

5. **It is journaled.** `AgentJournalService` records `COGNITIVE_STEP_ACTIVE`/
   `COGNITIVE_STEP_COMPLETED`/`debate:runtime:agent:error` entries per agent
   (`agent-journal-service.ts:129-191`). So `agent-creative` has a persistent activity log.

6. **It participates in the Mission Router fan-out.** Edge `e-router-creative`
   (`topology-defaults.ts:478`) + `e-creative-agg` (`topology-defaults.ts:530`) wire it
   into the default multi-agent topology; the LLM router decides when to send a task there.

7. **It has lifecycle/health state.** `AgentService` tracks `ready/busy/idle/paused/...`
   and `AGENT_HEALTH_CHANGE` triggers auto-spawn evaluation (`agent-service.ts:245-254,
588-665`). It can be paused/resumed/restarted/deleted from the UI.

## What it does NOT do (VERIFIED gaps)

- **No creativity-specific reasoning layer.** There is no "ideation engine," no
  brand-knowledge base, no narrative generator wired to it. Its "creativity" is purely
  the static prompt + high temperature.
- **No lens.** `lensIds: []` (`topology-defaults.ts:106`). It never gets a cognitive
  perspective transform.
- **Specializations are (almost) unused at execution time.** `Ideation/Narrative/Brand`
  are surfaced in the UI card and used by the **Invocation** expertise matcher
  (`invocation-engine-service.ts:167-173`), but the debate `PersonaSelector` ignores
  them (`persona-selector.ts`) and the router does not filter on them.
- **No memory specific to it** beyond the generic `AgentJournalService` log and the
  shared `debate-memory`/`crystal` stores (which are topic-keyed, not agent-keyed).
- **No scheduled or autonomous behavior.** It only acts when explicitly routed/invoked.
  Auto-spawn clones _other_ busy agents, not this one specifically
  (`agent-service.ts:614-665`).
- **Debate emits no cognitive events**, so `agent-creative` contributes nothing to the
  cognitive event stream when debating (`event-registry.ts` — debate uses `debate:*`,
  not `cognitive:*`; confirmed by AGENTS.md note).
