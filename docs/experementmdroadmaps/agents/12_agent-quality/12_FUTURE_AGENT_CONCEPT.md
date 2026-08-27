# 12_FUTURE_AGENT_CONCEPT — realized concept for `agent-quality`

> A concrete, _realizable_ concept built ONLY from existing capabilities. No new frameworks.

## Concept: "Quality Gate Keeper" — a claim-verifying, coverage-auditing participant

The profile already says it: _"Design testing strategies, identify coverage gaps, enforce quality gates. Consider unit, integration, e2e, and property-based testing."_ Today that sentence is decorative. The realized concept makes it **operational** by composing four existing pieces:

### Building blocks (all VERIFIED to exist)

1. **Persona steering** — `PersonaSelector` (`persona-selector.ts`). A `quality_assurance` variant (QW1/M4) turns the profile sentence into a live debate/debate prompt that demands falsifiable claims and proposes test designs.
2. **Identity + resolution** — `agentService.resolveAgent` + `agent-identity.ts` already surface name/role/specializations/avatar. No change.
3. **Invocation** — `AgentResolverDirectory` + `InvocationExecutionDelegate` already accept `agent-quality` as a human-picked target in chat/debate/scenario modes (`phase21-invocation.ts:44-89`). A QA policy (M3) makes it one-click.
4. **Observability** — `COGNITIVE_STEP_COMPLETED` → stats/journal/health already track it; a display-only `debate:quality:claim:checked` / `conversation:quality:gate` event (M1) surfaces verdicts in `LiveActivityStream`/`DirectorPanel`.
5. **Memory** — `service-backed-memory` (M2) stores QA findings keyed by artifact, giving continuity.
6. **Director turn** — `ConversationScenario` `TurnProposal.participantId='agent-quality'` (M5) makes a "QA Gate" step a first-class workflow.

### The realized agent, end-to-end

- **Trigger:** human clicks "Review with QA" (QW5/M3) → Invocation → `agent-quality` (chat or scenario).
- **Behaviour:** speaks with the `quality_assurance` persona (QW1) → demands falsifiable claims, proposes unit/integration/e2e/property tests, flags coverage gaps.
- **Output:** a structured QA verdict (pass/fail + checklist + coverage map) emitted as a display event (M1) and persisted to memory (M2).
- **Consumption:** Director "QA Gate" turn (M5) can gate scenario completion; Debate consensus (B1) can require a QA pass; Builder `quality_gate` node (B3) can block deploy.

### What it is NOT

- Not a new agent _type_ — it is the **same `agent-quality` node** with its dormant specialization finally wired through existing infra.
- Not a test _executor_ — it designs/reviews tests and gates; actual test running is out of scope (and would need a real test runner, deliberately avoided here).
- Not a separate bus/service — reuses `EventBus`, `agentService`, `AgentJournalService`, `service-backed-memory`, `lens-engine`, `PersonaSelector`, `phase21-invocation`.

### Why this is the right shape

The system already has 25 agent nodes sharing one behaviour surface. The leverage is in **activating specializations through existing seams** (persona, lens, invocation policy, director turn, memory category, display event) — not in building QA-specific machinery. This keeps `agent-quality` consistent with every other agent while making its unique value real.
