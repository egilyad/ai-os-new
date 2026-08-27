# 05_CONVERSATION_ROLE — `agent-quality` in ConversationCore / Director

## CURRENT (VERIFIED)

- `ConversationOrchestrator` / `ChatExecutor` resolve `agent-quality` via `agentService.resolveAgent` (`agent-service.ts:337-390`). The returned `model` is `undefined` (node `config.model:'auto'` → `agent-service.ts:351-353`) so the execution engine selects the model, **not** the profile's `llama-3.1-8b-instant`.
- In a Director `ConversationScenario`, `agent-quality` can be a `TurnProposal.participantId`; `HybridPolicy` + `ConversationOrchestrator` speak the authored objective using the node `systemPrompt` (`agent-quality` node prompt at `topology-defaults.ts:286`).
- Director lifecycle events (`conversation:turn:start/complete/error`, `conversation:completed`) flow to `useDirectorStore` (`AGENTS.md` B4/B6.2). `agent-quality` is indistinguishable from any other participant in that stream.

## POTENTIAL (INFERRED)

1. **QA review turn.** A scenario step "Quality Gate" where `agent-quality` reviews prior turns' outputs and emits a checklist of unmet quality criteria.
2. **Test-plan generation turn.** Given a feature spec from an earlier turn, `agent-quality` produces a unit/integration/e2e test outline (matches its node prompt exactly).
3. **Coverage report turn.** Summarize which requirements from the scenario are covered by produced artifacts.

## RECOMMENDED

- No engine change needed: Director already supports arbitrary `participantId`. The only gap is that the **profile model is ignored** (see 10/11). If the team wants `agent-quality` to stay on the cheap `llama-3.1-8b-instant`, set the topology node `config.model` to the explicit model id (or have `resolveAgent` prefer the profile model when the node model is `'auto'`).

## Scenarios

- **S1 — Spec→Tests:** Scenario turn 1 (architect) drafts a design; turn 2 (`agent-quality`) returns a test plan + coverage gaps.
- **S2 — PR review sim:** turn 1 produces code-like artifact; `agent-quality` emits a QA checklist (edge cases, regression risk).
- **S3 — Acceptance gate:** final turn is `agent-quality` deciding pass/fail against scenario objectives; Director `overrideTurn` could inject it on demand.

## Scenarios (INFERRED)
