# 05 — CONVERSATION ROLE for `agent-content` (ConversationCore / Director)

> ConversationCore = the event-driven conversation substrate; Director = the scenario orchestrator. `agent-content` participates as a generic participant. Labels: VERIFIED / INFERRED / OPINION.

## How it works today (VERIFIED)

- **Director scenario:** a `ConversationScenario` lists `participants` (id+role) and ordered `turns` (`TurnProposal` with `participantId` + `objective`). When the Director runs, `HybridPolicy` → `ConversationOrchestrator` → `ChatExecutor` executes each turn.
- **Agent resolution:** `ChatExecutor` calls `agentService.resolveAgent(participantId)` (agent-service.ts:337-390) to get the agent's `systemPrompt`, `model`, `displayName`, `avatar`, `specializations`. For `agent-content` this yields the content-strategist prompt + pinned llama-3.3-70b model.
- **Invocation handoff:** `InvocationExecutionDelegate.start()` in chat/director-scenario mode builds a scenario whose turns are `INTRODUCE` objectives for each selected agent (including `agent-content`) and calls `director.loadScenario` + `director.run()` — phase21-invocation.ts:89-108.
- **Events:** the orchestrator emits `conversation:turn:start|complete|error`, `conversation:paused|resumed|aborted|completed` (event-registry.ts; conversation-orchestrator.ts) — all generic, all agents.

## What `agent-content` contributes in a conversation

- It speaks **one turn at a time** with its content-strategist persona. There is no multi-turn "content plan," no draft/review loop, no SEO scoring — it is a single LLM response per turn, same as any agent.
- Its `specializations` are passed to `resolveAgent` (agent-service.ts:385) but the ChatExecutor **does not branch on them** — they are metadata only.

## Scenarios

1. **Editorial brainstorm session** — Director scenario: `agent-content` (lead, Messaging objective) → `agent-creative` (Ideation) → `agent-ux` (audience) → `agent-writer` (draft). Each turn is a `TurnProposal` with an `objective.description`. Output: a structured content brief.
2. **SEO audit conversation** — `agent-content` + `agent-research` (citations) + `agent-data` (keywords/trends) discuss a topic; `agent-content` owns the "how to rank / how to message" turn.
3. **Brand-voice consistency check** — `agent-content` reviews a draft produced by `agent-writer` and proposes messaging adjustments (a `CHALLENGE`/`REFINE` turn via Director `overrideTurn`).

## RECOMMENDED conversation patterns (OPINION)

- **Turn templates for content:** extend `TurnProposal.objective.type` vocabulary (currently INTRODUCE/CHALLENGE/etc.) with content-semantic types like `DRAFT`, `EDIT`, `SEO_REVIEW`, `MESSAGING_ANALYSIS`. These are _generic_ objective types — any agent could use them, but `agent-content` would be the natural owner. This keeps the change in shared infra (no agent fork).
- **Multi-pass content loop:** a Director scenario that runs `agent-content` DRAFT → `agent-critic` REVIEW → `agent-content` EDIT is already expressible today with existing `TurnProposal`s; it just isn't packaged as a reusable template.

## Gaps

- No way to give `agent-content` a _content-specific system prompt extension_ at scenario time (e.g., "use AP style"). The `systemPrompt` is fixed from node config; `TurnProposal.objective` is the only per-turn steer.
- No streaming of partial drafts / no structured content output (markdown/HTML) contract.
