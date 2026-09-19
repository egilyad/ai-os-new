# 04_DEBATE_ROLE — `agent-critic` in Debate

## CURRENT state (VERIFIED)

- `agent-critic` is **not** auto-assigned to debates. A debate participant list is chosen by the user (or default topology). There is no code that says "the critic must be in every debate."
- When present, `persona-selector.ts` chooses a **persona variant** for it based on:
  - its assigned debate **role** (`pro`/`con`/`neutral`) — `persona-selector.ts:263`
  - **topic keyword match** against 11 variant trigger-word lists — `persona-selector.ts:243-249, 271-285`
  - round number (`minRound`) — `persona-selector.ts:262, 287-289`
- The critic's **own system prompt** ("find weaknesses, edge cases, logical fallacies") is layered on top of the chosen variant prompt (`topology-defaults.ts:250`). The variant and the critic persona are orthogonal — the selector does **not** know the agent is a "Critical Auditor."
- The `critic` variant in `persona-selector.ts:194-216` ("Cultural Critic", power-structures lens) is a **different** concept from our `agent-critic`; it is not bound to the agent.
- Debate does **not** emit `COGNITIVE_STEP_COMPLETED`, so during a debate the critic accrues **no stats, journal, or memory** (`agent-service.ts:184` only fires from topology; grep shows no `COGNITIVE_STEP_COMPLETED` emit in `debate-runtime/`).

**Net:** In debate today, `agent-critic` is a generic agent with a skeptical prompt. Its "fallacy detection" is purely the LLM following the prompt — no structured critique, no scoring, no audit trail.

## POTENTIAL (INFERRED / OPINION)

The agent is the **natural red-team / devil's-advocate / fallacy-hunter** of the system. Three strong justifications:

1. Its specializations literally are _Critical Analysis, Fallacy Detection, Logic_ (`agent-profiles.ts:110`).
2. Its temperature is 0.1 (skeptical, deterministic) — tuned for critique, not generation (`topology-defaults.ts:251`).
3. `persona-selector` already has a `philosopher`/`critic`/variants that do logical-consistency and power-analysis — a perfect fit.

## RECOMMENDED (OPINION)

Add a **"Critic / Red-team" debate role** distinct from `pro`/`con`/`neutral`:

- A `red-team` role where the agent's sole job is to attack the strongest argument, enumerate fallacies, and produce a **structured critique object** (`{ claim, fallacyType?, severity, counterEvidence }`).
- Wire `lens:critical` (`lens-library.ts:11-41`) into the critic's debate prompt automatically when the agent is the critic.
- Emit a `debate:critique:produced` event (new) so the UI can render a "Critique" lane and the aggregator can weigh it.

## 3 Scenarios

1. **Devil's advocate round.** After pro/con exchange, a `red-team` round assigns `agent-critic` to demolish the leading position; output feeds a "weakest-link" summary shown in `DebateRuntimePanel`.
2. **Fallacy audit.** On each argument, critic flags formal/informal fallacies; a badge (⚠ fallacy) appears on the argument card. Uses the agent's `Fallacy Detection` specialization as the prompt anchor.
3. **Pre-consensus sanity gate.** Before `DEBATE_CONSENSUS` is emitted (`event-registry.ts:793`), the critic must sign off that no obvious contradiction remains; otherwise consensus is downgraded to "needs-review."
