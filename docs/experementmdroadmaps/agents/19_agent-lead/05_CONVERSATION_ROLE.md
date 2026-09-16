# 05_CONVERSATION_ROLE — `agent-lead` in ConversationCore / Director

> Tags VERIFIED / INFERRED / OPINION.

## CURRENT state (VERIFIED)

- **Turn speaker with identity.** `ConversationOrchestrator` (B4, `conversation-orchestrator.ts`) proposes turns via policy; the execution engine resolves the participant through `agentService.resolveAgent(participantId)` (`agent-service.ts:337`, comment `:331-336`). So when a scenario/script assigns a turn to `agent-lead`, it is voiced by Victor Soto with the team-lead prompt + nvidia model.
- **Director scenarios.** A `ConversationScenario` can list `agent-lead` as a participant (`AGENTS.md` B5.3: `TurnProposal.participantId`). The `HybridPolicy` + `ConversationOrchestrator` drive it; `ChatExecutionEngine` runs the LLM call. No lead-specific handling.
- **Room invocation → ConversationCore.** `phase21-invocation.ts:89-108` builds a 1-turn `INTRODUCE` scenario per selected agent and runs it. If a human picks agent-lead in Room, it runs a solo conversation turn as Victor Soto.

## POTENTIAL roles (INFERRED)

1. **Scenario Coordinator.** In multi-agent Director scenarios, agent-lead could be auto-injected as a `CHALLENGE`/`synthesis` turn between other agents' turns (reuse `TurnProposal` + override API, `AGENTS.md` B5.4b `override()`).
2. **Run moderator / status reporter.** The Director already emits `conversation:*` events (`event-registry.ts` B4). agent-lead could be the _narrator_ of a run — a synthesized "what just happened" turn — by consuming `CONVERSATION_TURN_COMPLETE` and emitting a summary turn.

## Scenarios (INFERRED)

- **S1 — Standup simulation.** Director scenario: agent-pm sets goals → agent-devops reports → agent-lead synthesizes blockers + unblocks (its prompt). Today achievable by hand-authoring the scenario in ScenarioEditor (B5.3); agent-lead is just one participant.
- **S2 — Architecture RFC conversation.** agent-architect proposes design → agent-security challenges → agent-lead coordinates a reconciled decision turn.
- **S3 — Room "lead my task".** Human in Room picks agent-lead + mode Chat + task "coordinate the plan from agent-pm". Runs a ConversationCore turn as Victor Soto. Works today via phase21.

## RECOMMENDED (OPINION)

Two cheap wins, no new contracts:

- **(a)** Document/seed a reusable "Team Sync" Director template in ScenarioEditor that features agent-lead as coordinator (reuses B5.3 create path).
- **(b)** Add a `coordinator` turn-type hint so HybridPolicy can insert agent-lead synthesis turns automatically when ≥3 agents are in a scenario — pure policy logic, reuses `TurnProposal`.

## Risk / Dependencies

- No kernel change needed for S1/S3 (UI authoring only). S2/b needs a policy rule in `HybridPolicy` (`AGENTS.md` B3). Low risk.
