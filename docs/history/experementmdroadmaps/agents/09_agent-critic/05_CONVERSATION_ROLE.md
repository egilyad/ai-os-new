# 05_CONVERSATION_ROLE — `agent-critic` in ConversationCore / Director

## CURRENT state (VERIFIED)

- `ConversationOrchestrator` and the conversation-backed debate orchestrator resolve participants via `agentService.resolveAgent(id)` — `agent-service.ts:337-390`. So `agent-critic` can be a conversation participant.
- `ConversationDirectorService` (B3-B6 in AGENTS.md) runs a `Scenario` whose turns have `participantId`. If a turn's `participantId === 'agent-critic'`, the director's `HybridPolicy` → `ChatExecutor` will speak **as** the critic (persona + pinned nvidia model).
- The agent's `specializations`, `avatar`, and `provider/model` flow through `ResolvedAgent` into the executor. There is no critic-specific logic — it is just another participant with a skeptical prompt.
- `phase21-invocation.ts:89-108` shows that an Invocation in `chat`/`director-scenario` mode literally builds a one-turn-per-agent `Scenario` and runs it through the Director. So a Room invocation of `agent-critic` becomes a Director session where the critic produces one turn.

## POTENTIAL (INFERRED / OPINION)

ConversationCore is the **cleanest** place to give the critic a real job, because:

1. The Director already supports structured `TurnProposal`s with `objective.type` + `constraints`.
2. A **"Critique" turn type** could be added: `objective.type: 'CRITIQUE'`, where the critic receives the _other_ participants' outputs as context and must return a structured critique.
3. The `resolveAgent` seam already exposes `specializations` (`agent-service.ts:385`) — the Director could _route_ critique objectives to the agent that lists `Critical Analysis`.

## RECOMMENDED (OPINION)

- Add objective routing: when a `Scenario` contains a `CRITIQUE`/`REVIEW` turn, default `participantId` to `agent-critic` if present, else to the agent whose `specializations` include `Critical Analysis`.
- Inject `lens:critical` questions (`lens-library.ts:18-23`) into the critique turn's system prompt automatically.
- Record the critique turn result as a first-class `conversation:turn:complete` payload so `DirectorStore` can render a "Critique" lane (`stores/directorStore.ts`).

## 3 Scenarios

1. **Post-hoc critique scenario.** A scenario runs N agents, then a final `CRITIQUE` turn by `agent-critic` reviews all prior outputs and emits a consolidated weaknesses report.
2. **Pairwise review.** Each generative turn is followed by a critic turn that audits the immediately preceding message for logical/feasibility flaws before the next agent sees it (a "review gate").
3. **Human-in-the-loop review.** A Director scenario pauses after the critic's turn (`directorController.pause()`) so a human approves/overrides the critique before synthesis.
