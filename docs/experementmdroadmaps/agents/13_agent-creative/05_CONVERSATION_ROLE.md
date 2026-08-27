# 05_CONVERSATION_ROLE — ConversationCore / Director role

## CURRENT (VERIFIED)

`agent-creative` participates in ConversationCore via two seams:

1. **ChatExecutor metadata path.** `ChatExecutor.executeRequest` reads
   `req.options?.metadata?.agentId` (`chat-executor.ts:121`) and applies an agent policy
   check. The actual persona/model for the reply is resolved earlier by the caller — the
   conversation execution engine resolves the participant:
   `conversation-execution-engine.ts:40`
   (`this.agentResolver?.resolveAgent(proposal.participantId)`). That resolved agent
   supplies `systemPrompt`, `model`, `displayName`, `avatar` used to build the LLM request.
2. **Director TurnProposal.** A `ConversationScenario` turn with
   `participantId: 'agent-creative'` is spoken by this node through
   `HybridPolicy` → `ConversationOrchestrator` → `ChatExecutionEngine`
   (B3/B4 of AGENTS.md; `conversation-execution-engine.ts:40`). The Director's
   `DirectorStore` (`directorStore.ts`) shows live turn logs.

So `agent-creative` in ConversationCore = a **chat speaker** whose voice is its node
prompt + pinned openrouter-70B model, with `temperature: 0.8` baked into the node config
(`topology-defaults.ts:301`).

## Behavior notes

- **No conversation-specific creativity logic.** Like debate, its "creativity" is the
  static prompt + temperature. No ideation loop, no brand memory.
- **It emits `conversation:*` events** during a Director run (`event-registry.ts` B4:
  `turn:start/complete/error`, `paused`, `resumed`, `aborted`, `completed`), which
  `directorStore` and `invocationStore` observe. So a creative turn is fully observable
  in the Run UI.

## POTENTIAL scenarios (INFERRED, reuse-existing)

- **Ideation session.** A Director scenario: `agent-creative` proposes 10 concepts →
  `agent-critic`的压力-tests → `agent-content` drafts messaging. Fully buildable today
  with existing `ConversationScenario` + `TurnProposal` (no code change beyond authoring
  the scenario in the UI — B5.3 `ScenarioEditor`).
- **Narrative co-writing.** Multi-turn chat where `agent-creative` progressively refines
  a story; human interrupts via Director `overrideTurn`.
- **Brand voice consistency.** `agent-creative` generates copy; a "brand lens" (see
  `12_FUTURE_AGENT_CONCEPT.md`) could gate tone — but that requires a creative lens that
  does not yet exist (`lens-library.ts` has none).

## RECOMMENDED

Treat `agent-creative` as the **default "发散/ideation" speaker** in any Director scenario
that needs novel angles, and pair it with `agent-critic`/`agent-content` for
divergence→convergence. The capability is already present; the gap is **discoverability**
(a user must know to pick it) and **continuity** (no memory of past brand decisions —
see `08_MEMORY_AND_CONTEXT.md`).
