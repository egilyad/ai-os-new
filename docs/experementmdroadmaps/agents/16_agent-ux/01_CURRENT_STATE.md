# 01_CURRENT_STATE — What `agent-ux` ACTUALLY does now

> Honest, shared-infrastructure view. **[VERIFIED]** unless tagged.

## The honest headline

`agent-ux` is **not a specialized UX subsystem**. It is one of 25 topology nodes whose entire "UX researcher" behavior is:

1. A system prompt: _"You are a UX researcher. Analyze user behavior, identify pain points, and propose evidence-based improvements. Use heuristics and usability principles."_ (`topology-defaults.ts:334-340`)
2. A curated identity (name, avatar 🔍/`#06b6d4`, model `groq/llama-3.1-8b-instant`, specializations) merged into the node at build time (`topology-defaults.ts:91-119`).
3. A low temperature (0.35) and `SEARCH_TOOLS` (`topology-defaults.ts:337-338`).

When `agent-ux` "runs", the runtime does exactly what it does for any agent node:

- Resolves the node from the active topology (`agent-service.ts:337-390` `resolveAgent`).
- Builds a `ChatMessage` from the node system prompt + upstream output (`chat-executor.ts:143-151`, `cognitive-service.ts:419-424`).
- Routes the LLM call via the Smart Router / key pool (`cognitive-service.ts:432-463`), executes with a 30s hard timeout (`cognitive-service.ts:470`).
- Emits `COGNITIVE_STEP_ACTIVE` / `COGNITIVE_STEP_COMPLETED` (`cognitive-service.ts:199-259`), which `AgentService` consumes for stats (`agent-service.ts:184-210`) and `AgentJournalService` consumes for a journal entry (`agent-journal-service.ts:130-172`).
- In debate, the `debate-agent-executor` overlays a `PersonaSelector` variant chosen by **topic keywords** (`persona-selector.ts:243-309`) — this is generic and not UX-aware.

## What it is NOT doing

- **No UX-specific tools.** It has `SEARCH_TOOLS` (the same generic web/search tools many agents share). There is no usability-test harness, no heuristic-evaluation tool, no survey/interview instrument, no analytics connector. **[VERIFIED]** (`topology-defaults.ts:338`; no `agent-ux`-specific tool registration exists).
- **No lens.** `lensIds` is `[]`. It does not carry or apply a UX lens. **[VERIFIED]** (`topology-defaults.ts:106`, `lens-library.ts` has no UX lens).
- **No memory scoped to UX knowledge.** It uses the generic `MemoryService` (`memory-engine.ts:52`) like every other agent; nothing writes UX-specific memories. **[INFERRED]** from generic memory design.
- **No participation in Research/Knowledge/Crystal/Forum/Workflow beyond generic identity resolution.** Those modules use `agentService`/`resolveAgentIdentity` to _display_ an agent, not to give `agent-ux` a special role. **[VERIFIED]** (grep `agent-ux` finds no module-specific reference).
- **Debate emits no cognitive events**, so `agent-ux` debate activity is invisible to the cognitive stream; only `COGNITIVE_STEP_COMPLETED` (from the orchestrator/chat path) feeds stats. **[VERIFIED]** (shared context; `event-registry.ts` debate events are separate from cognitive events).

## Net current capability

In practice, today `agent-ux` is a **small-model (8B) general analyst** whose only distinguishing trait is a prompt that says "you are a UX researcher" and a low temperature. Its output quality is bounded by `llama-3.1-8b-instant`, which is a weak model for nuanced usability reasoning. **[OPINION]** The 8B model choice is likely a cost/latency default, not a deliberate UX capability decision — see `02_CAPABILITIES.md` and `10_PROBLEMS_AND_LIMITATIONS.md`.

## Invocation surface (what a user can do with it right now)

- **Manually** invoke from RoomPanel (human picks `agent-ux` → Invocation Engine → chat/director-scenario or debate). **[VERIFIED]** (`phase21-invocation.ts:43-58,151-167`).
- **In debates**, if added as a participant.
- **In Director scenarios**, if named as a `participantId`.
- **In the default topology**, automatically when the router routes a task to it (edge `e-router-ux`, `topology-defaults.ts:481`).
- **Never self-invokes** (invocation authority = human; `phase21-invocation.ts` policy `allowAgentInitiatedInvocation:false`). **[VERIFIED]**
