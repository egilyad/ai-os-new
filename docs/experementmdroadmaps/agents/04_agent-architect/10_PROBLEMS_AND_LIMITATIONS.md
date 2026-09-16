# 10 — PROBLEMS & LIMITATIONS: `agent-architect`

> Concrete, VERIFIED issues. No fabrication.

1. **Specializations are decorative.** `agent-profiles.ts:59` lists Distributed Systems / Event-Driven / Scalability, but **nothing routes to the architect because of them** — selection is generic (router/participant list). No topic→specialization dispatch exists. [VERIFIED: `persona-selector.ts` is topic-keyword only; no agent-spec mapping].
2. **Persona diluted in debate.** `PersonaSelector.selectForTopic` (`persona-selector.ts:292`) assigns a _generic_ variant by topic keywords, layered over the architect's prompt. The architect's identity is not foregrounded. [VERIFIED code; effect INFERRED].
3. **No lens bound.** Node config has no `lensIds` (`topology-defaults.ts:183-193`); `lens:security` etc. are applicable to `architecture` taskType but never attached. [VERIFIED].
4. **"Architecture Review" feature does NOT use this agent.** `architectureReviewService` (`architecture-review-service.ts:99`) is a static file-tree analyzer (structure/cycles/duplicates). It never invokes `agent-architect`. Two different "architecture" concepts coexist with no link → user confusion. [VERIFIED].
5. **No architectural reasoning surfaced.** Only `COGNITIVE_STEP_COMPLETED` stats/journal; `cognitive:decision:made` is dead-at-consumer. Debate emits no cognitive events. [VERIFIED: `event-registry.ts:776`, AGENTS.md].
6. **No memory recall.** Architect reads no persistent memory; prior design conclusions are not fed back. [VERIFIED: static prompt `topology-defaults.ts:188`; journal is write-only-for-recall].
7. **Builder/Workflow debate hook is BROKEN.** `builder-agent-service.ts:40` emits `debate:start` which is **not a registered event** (real one is `debate:started`, `event-registry.ts:788`); and `workflow-service.ts` dispatch is unwired [per AGENTS.md]. Any "architect-in-workflow" path is non-functional. [VERIFIED code + AGENTS.md].
8. **No topic-driven auto-selection.** Unlike research/risk agents, there is no mechanism that _prefers_ the architect for architecture topics in debate or invocation. [VERIFIED: no such router hook found].
9. **No agent-specific UI.** No dedicated panel/tab; only generic AgentsPanel + a confusingly-named separate `ArchitectureReview`. [VERIFIED].
10. **Generic avatar fallback path.** `AgentAvatar.tsx:47` (`getAgentAvatar`) is a deterministic hash, NOT a reader of `AGENT_PROFILES`. The canonical 🏗️/#8b5cf6 is supplied via the identity/avatar-service chain, not this component. If the identity chain is bypassed, the architect silently renders a fallback glyph. [VERIFIED: `AgentAvatar.tsx:47-54` has no AGENT_PROFILES import].

> Note on repo-level LSP: `dexie-schema.ts:20` / `interfaces.ts:8` reference `./invocation-types` which does not resolve — a pre-existing build gap in the invocation feature, independent of this agent (flagged for awareness, not introduced here).
