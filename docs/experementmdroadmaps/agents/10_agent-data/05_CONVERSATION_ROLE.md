# 05_CONVERSATION_ROLE — `agent-data` in ConversationCore / Director

## How it works today (VERIFIED)

- ConversationCore resolves participants through `AgentService.resolveAgent` (`agent-service.ts:337`). `agent-data` is a valid participant — its `id`, `name`, `role`, `model` (`llama-3.3-70b-versatile`), `provider` (`groq`), `specializations`, and `avatar` are returned.
- The `ConversationOrchestrator` and `ConversationDirectorService` (B3/B4 from AGENTS.md) drive turns via `HybridPolicy` → `ChatExecutionEngine` → `ChatExecutor`, which speaks _as_ the resolved agent (persona + pinned model). So when a scenario includes `participantId: 'agent-data'`, Sam responds using her node config.
- `ChatExecutor` reuses the standard LLM adapter path; the groq/llama-3.3-70b-versatile pin from `node.config` applies (same mechanism as debate, `debate-api.ts:315-319` analog in `resolveAgent` returning `model`).
- Invocation Engine's `InvocationExecutionDelegate.start` (phase21-invocation.ts:68-109) creates a scenario from the requested agents and calls `director.loadScenario` + `run()` — so a Room invocation of `agent-data` becomes a ConversationCore session whose `sessionRef` is a scenario id.

## Role today

A neutral, evidence-first **analyst voice** in structured conversations (scenarios/director runs). No special handling — identical to any other agent node.

## Scenarios (OPINION, mechanics VERIFIED)

1. **"Data audit" scenario** — Director scenario with a single `agent-data` turn (`objective: INTRODUCE` → "Audit this dataset for leakage/sampling bias"). Uses existing `ScenarioRepository.create` + `director.run()`.
2. **Hybrid forecasting session** — `agent-data` + `agent-risk` as conversation participants; `HybridPolicy` orders turns; output feeds Crystal (phase14) as a "Quantified Uncertainty" crystal.
3. **Human-in-the-loop analytics** — RoomPanel → Invocation (mode `chat`) → `agent-data` answers a statistical question; `conversation:*` events stream to `useInvocationStore`/`DirectorStore`. Existing chain proven in B6.1 E2E.

## Recommended enhancement (OPINION)

Let scenarios declare a **participant "voice profile"** that pulls from `specializations` to prepend a statistics/ML system-prompt fragment (reusing `ARGUMENT_STRATEGY_INSTRUCTIONS` pattern). This makes `agent-data`'s ConversationCore turns distinct without new services — only a prompt-augmentation step in `ConversationOrchestrator` keyed on `resolvedAgent.specializations`.
