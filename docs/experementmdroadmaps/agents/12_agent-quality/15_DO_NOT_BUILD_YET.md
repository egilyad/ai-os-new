# 15_DO_NOT_BUILD_YET — ideas to AVOID for `agent-quality`

> Guard against over-engineering. The repo already has 25 agents sharing one behaviour surface; resist building 25 mini-frameworks.

## ❌ Do NOT build (with reason)

1. **A dedicated `QualityAgentService` that duplicates `AgentService`.** VERIFIED: `AgentService` already resolves/identities/stats/lifecycles every node (`agent-service.ts:71-390`). A parallel service fragments identity and stats. Reuse `agentService`.
2. **A second cognitive/QA event bus.** VERIFIED: `EventBus`/`coreEventBus` already carry `COGNITIVE_*` and `conversation:*`/`invocation:*`/`debate:*`. AGENTS.md explicitly: "no new buses/adapters/facades" for Invocation. Add at most ONE display-only event (M1), not a bus.
3. **A bespoke 16th memory store just for QA.** VERIFIED: 15 generic memory stores exist (`src/kernel/services/memory/*`); `service-backed-memory.ts` is the intended store-backed path. Do NOT add `qa-memory.ts`; reuse.
4. **A real test-execution engine inside the agent.** Out of scope and risky: would need a sandboxed runner, result parsing, CI hooks. `agent-quality` should _design/review/gate_ tests, not run them. Defer (Philosophy B only, later).
5. **A QA Panel separate from `AgentDetailPanel`.** VERIFIED: `AgentsPanel` + `AgentDetailPanel` + `RoomPanel` already cover identity/invoke/observe. A new panel duplicates UI and diverges from the shared agent UX. Reuse existing panels + chips/buttons.
6. **Reviving `cognitive:decision:made` as a producer dependency.** VERIFIED dead-at-consumer (`event-registry.ts:776`, AGENTS.md). Do NOT make `agent-quality` depend on it. Use a dedicated display event instead.
7. **Hard-coding QA into Debate consensus flow without a flag.** VERIFIED `debate-sync-manager` already finalizes `qualityCollector` (technique impact). Adding a mandatory `agent-quality` gate unconditionally changes debate semantics for all users. Make it opt-in (policy/flag), consistent with existing `qualitySettings` pattern (`debate-session.ts:40-43`).
8. **Auto-spawning clones of `agent-quality` via `autoSpawnConfig`.** VERIFIED threshold logic (`agent-service.ts:81-86`) is generic; cloning QA agents unpredictably is unlikely to help and adds cost. Keep manual/human-invoked unless B2 proves value.
9. **A "QA score" leaderboard metric that competes with Elo.** VERIFIED `EloLeaderboard.tsx` exists. A separate QA score fragments rankings; if needed, fold QA verdicts into existing stats, don't invent a new ranking axis.
10. **New Dexie tables for QA (invocations/policies already added for Invocation).** VERIFIED schema is at v20. Adding `qa_*` tables duplicates what `service-backed-memory`/journal KV already provide. Reuse KV.
11. **Treating `agentQualityActivations` (`debateLiveStore.ts`) as this agent.** VERIFIED it tracks _debate-quality-technique_ activations, unrelated to `agent-quality`. Do NOT wire QA-agent logic to that field.
12. **Per-agent prompt compilers / DSL for QA.** The node `prompt` (`topology-defaults.ts:286`) + persona variant (QW1) suffice. A QA-specific prompt DSL is premature.
13. **Forking `PersonaSelector` for QA.** VERIFIED it is shared by all agents. Extend it (add a variant + fallback), do not fork.
14. **Making `agent-quality` the default debate participant.** It should be chosen for QA-relevant topics, not forced everywhere; forcing reduces debate diversity.
15. **Blocking deploys automatically from a single QA agent verdict.** High blast radius; requires human authority (D6 in INVOCATION_ENGINE design: "Authority = human; agents never self-invoke"). Gate, suggest, surface — don't auto-block without explicit policy.

## Principle

Maximise reuse of: `AgentService`, `agent-identity.ts`, `PersonaSelector`, `AgentJournalService`, `AgentHealthMonitor`, `service-backed-memory`, `lens-engine`, `phase21-invocation`, `EventBus`, `AgentsPanel`/`RoomPanel`/`DirectorPanel`. Build thin, additive, display-only where possible.
