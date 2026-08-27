# 05_CONVERSATION_ROLE — `agent-perf` in ConversationCore / Director

## CURRENT state `[VERIFIED]`

- `ConversationOrchestrator` / `ChatExecutor` resolve participants via `agentService.resolveAgent(id)` (`agent-service.ts:337`), which returns `agent-perf`'s prompt + pinned model (`groq`/`llama-3.3-70b-versatile`). So a Director scenario turn spoken "by Leon Ortiz" carries the perf system prompt. `[VERIFIED]`
- `ConversationDirectorService` + `HybridPolicy` + `ChatExecutionEngine` path is the production LLM boundary (AGENTS.md B5.4a). `agent-perf` can be a `participantId` in any scenario. `[VERIFIED]`
- On this path `COGNITIVE_STEP_COMPLETED(nodeId=agent-perf)` fires → its AgentCard stats and journal **do** update. This is the path where `agent-perf` is fully observable. `[VERIFIED]` + `[INFERRED]`
- Invocation (Room) handoff to Director: `InvocationExecutionDelegate.start` builds a scenario from the selected agents and calls `director.run()` (`phase21-invocation.ts:89-108`). A human invoking `agent-perf` (chat mode) thus runs it through ConversationCore. `[VERIFIED]`

## POTENTIAL roles `[OPINION]`

1. **Standalone "performance review" scenario** — a Director scenario where `agent-perf` is the sole participant given a system description and asked to produce a bottleneck report. Already possible today via Room → chat.
2. **Perf + architect pair** — two-participant scenario (`agent-perf` + `agent-architect`) for joint optimization proposals; results could be crystallized into the Crystal Vault.
3. **Post-debate deep-dive** — after a perf debate, auto-invoke `agent-perf` via Director to turn the debate transcript into a concrete optimization plan.

## Scenarios

1. **"Review this service architecture for bottlenecks."** — Director scenario, `agent-perf` only, objective `INTRODUCE`/custom; output is a perf assessment. Fully functional today.
2. **"Turn the latency debate into an action plan."** — `agent-perf` consumes `debate:verdict:generated` (existing bridge pattern, AGENTS.md Module 6) and drafts optimizations.
3. **"Load-test plan for checkout."** — `agent-perf` + `agent-devops` produce a plan; `agent-perf` owns the load-test portion via its `Load Testing` specialization (currently only textual).

## Recommendation `[OPINION]`

ConversationCore is the **healthiest** integration for `agent-perf` (full observability). Make it the default surface for perf work and use Debate only for adversarial perf disputes.
