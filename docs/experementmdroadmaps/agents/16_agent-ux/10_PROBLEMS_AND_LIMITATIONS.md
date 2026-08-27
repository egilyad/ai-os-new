# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED issues for `agent-ux`

> Only concrete, source-backed problems. **[VERIFIED]** = confirmed in code; **[INFERRED]** = strong derivation.

## P1 — No real UX differentiation (core gap)

`agent-ux` differs from any other agent **only** by a system prompt + avatar + model. No UX tool, lens, persona, or memory. **[VERIFIED]** (`grep agent-ux` → only `topology-defaults.ts`, `agent-profiles.ts`, `prompt-audit-service.ts`; `lens-library.ts` has no UX lens; `persona-selector.ts` has no UX variant).

## P2 — Weak model for nuanced UX reasoning

`model: 'llama-3.1-8b-instant'` (8B) is small/fast; usability/Interview synthesis needs deeper reasoning. **[VERIFIED]** (`agent-profiles.ts:179`, merged at `topology-defaults.ts:104-105`). **[OPINION]** likely a cost default, not a UX decision.

## P3 — Debate path invisible to cognitive stream

Debate turns emit `DEBATE_*` only, never `COGNITIVE_STEP_COMPLETED`, so `agent-ux` debate activity never reaches stats/traces. **[VERIFIED]** (shared context; `event-registry.ts` debate vs cognitive separation; `debate-agent-executor.ts` emits no cognitive events).

## P4 — `COGNITIVE_DECISION_MADE` is dead for this agent

Emitted by `CognitiveService.executeAgentNode` (`cognitive-service.ts:414`) but no consumer surfaces an agent-level decision for `agent-ux`. **[VERIFIED]** (shared context + no subscriber found).

## P5 — Persona selector has no UX/research variant

All 11 variants (`persona-selector.ts:3-241`) are domain-general; none triggers on usability/accessibility/interview keywords. In debates `agent-ux` gets a mismatched persona. **[VERIFIED]**.

## P6 — No UX-specific memory

Generic `MemoryService` only; nothing writes/reads UX findings for `agent-ux`. Each run starts cold. **[INFERRED]** from `memory-engine.ts` generic design + no `agent-ux` references.

## P7 — Prompt-audit grouping is misleading

`prompt-audit-service.ts:24` files `agent-ux` under `'Creative'` — a grouping that does not reflect its analytical UX role and has no behavioral effect. **[VERIFIED]** (cosmetic only).

## P8 — No continuity of "who the user is"

`agent-ux` cannot persist discovered user personas across sessions; every invocation re-derives from scratch. **[INFERRED]** (no persona-memory writer).

## P9 — Invocation default policy is source-only

The manual Room policy matches `source:'human-mention'` and permits any registered agent, but there is **no expertise-match suggestion** to nudge humans toward `agent-ux` for UX topics. **[VERIFIED]** (`phase21-invocation.ts:125-144`).

## P10 — Statistics are shallow for UX value

Stats track calls/tokens/latency/errors/cost (`agent-service.ts:15-23`) — not UX outcomes (e.g., # of usability issues found, severity). No domain KPI. **[INFERRED]**.

## Risk note

None of these are crashes/regressions — they are **capability gaps**, not defects. Fixing them is additive (new lens/persona/memory-tag/UI), consistent with the repo's "no new buses/adapters" discipline. **[OPINION]**
