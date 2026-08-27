# 11_OPPORTUNITIES — Quick wins, medium, big ideas

All reuse existing infra. IDs: `Q`=quick, `M`=medium, `B`=big. Each: ID · Description · User value · Technical reuse · Effort · Risk · Dependencies · Existing infra · Why now.

## 5 QUICK WINS

**Q1 — Emit cognitive events from debate**

- Desc: In `debate-agent-executor.ts`, after a successful `callLLM`, emit `COGNITIVE_STEP_COMPLETED{nodeId, traceId, status, duration, output, model}`.
- Value: `agent-perf` (and all agents) become visible in stats/journal/live-stream during debates — fixes P1.
- Reuse: existing `EVENTS.COGNITIVE_STEP_COMPLETED`; subscribers already exist.
- Effort: S (1 file, ~5 lines). Risk: Low (mirrors ConversationCore). Deps: none. Infra: `agent-service.ts:184`, `agent-journal-service.ts:150`. Why now: highest ROI, unblocks everything else.

**Q2 — Add `performance_engineer` persona variant**

- Desc: New entry in `persona-selector.ts` VARIANTS with perf trigger keywords.
- Value: perf debates get a fitting voice for `agent-perf`.
- Reuse: `PersonaSelector` registry, no new code path.
- Effort: S. Risk: Low. Deps: none. Infra: `persona-selector.ts:3`. Why now: cheap specialization.

**Q3 — Tag journal entries with `performance` when actor is `agent-perf`**

- Desc: In `agent-journal-service.ts` record, add `tags:['performance']` when `agentId==='agent-perf'`.
- Value: `listByTag('performance')` continuity view (P memory gap).
- Reuse: `JournalEntry.tags` already exists (`:17`).
- Effort: S. Risk: Low. Deps: none. Infra: `agent-journal-service.ts`. Why now: zero-schema continuity.

**Q4 — Honest tool state on AgentCard**

- Desc: Render `benchmark`/`profiler` as "declared (no tool)" or hide them.
- Value: stops over-promising capability (P2).
- Reuse: `AgentCard.tsx:106-118` + tool registry lookup.
- Effort: S. Risk: Low. Deps: tool-registry enum. Infra: `AgentCard.tsx`. Why now: truthfulness.

**Q5 — "Profile this" quick action on card**

- Desc: Card action opens Room with `agent-perf` pre-selected, mode=chat.
- Value: one-click perf invocation.
- Reuse: `RoomPanel` + `AgentResolverDirectory` + `phase21-invocation.ts`.
- Effort: S–M. Risk: Low. Deps: Room route. Infra: `AgentsPanel`, `RoomPanel`. Why now: showcases the agent.

## 5 MEDIUM

**M1 — Performance lens (`lens:performance`)**

- Desc: New built-in lens in `lens-library.ts` (perspective-inject perf questions); attach to `agent-perf` via `normalizeAgentIdentity` lensIds.
- Value: perf reasoning surfaces in Synthesis/Lenses subsystem.
- Reuse: `LensEngineService`, `lens-library.ts`, `agent-identity.ts`.
- Effort: M. Risk: Low. Deps: lens engine. Infra: `lens-library.ts:10`. Why now: fills P4.

**M2 — Post-debate Crystal from `agent-perf` output**

- Desc: Bridge `debate:verdict:generated` → `crystalVault.propose` for perf topics (reuse `crystal-debate-bridge`).
- Value: durable perf knowledge.
- Reuse: `crystal-debate-bridge` (Module 2).
- Effort: M. Risk: Low. Deps: Crystal Vault. Infra: Module 2. Why now: continuity.

**M3 — Perf scenario templates in Director**

- Desc: Seed 2–3 Director scenarios (bottleneck review, load-test plan, cache assessment) with `agent-perf`.
- Value: ready-made perf workflows.
- Reuse: `scenario-repository.create`, DirectorPanel.
- Effort: M. Risk: Low. Deps: Director. Infra: B5.3. Why now: adoption.

**M4 — Perf filter in AgentsPanel**

- Desc: Filter agents by specialization containing `Profiling|Caching|Load Testing`.
- Value: find perf-capable agents fast.
- Reuse: existing search/filter UI.
- Effort: S–M. Risk: Low. Deps: none. Infra: `AgentsPanelView.tsx:226`. Why now: discoverability.

**M5 — Room "performance review" preset**

- Desc: RoomPanel preset that pre-fills `agent-perf` + a perf task template.
- Value: guided perf invocation.
- Reuse: RoomPanel form.
- Effort: M. Risk: Low. Deps: RoomPanel. Infra: Step 6. Why now: UX polish.

## 3 BIG IDEAS

**B1 — Real measurement harness behind `agent-perf`**

- Desc: A `PerfProbe` tool the LLM can call: run a benchmark/load-test against a provided endpoint, return latency/throughput. Wire `benchmark`/`profiler` tool ids to it.
- Value: turns the title into real capability (P6).
- Reuse: tool registry + `debate-agent-executor`/`ChatExecutor` tool-call path.
- Effort: L. Risk: Med (sandboxing/security). Deps: tool-exec infra, sandbox. Infra: tool system. Why now: the defining gap.

**B2 — Perf observability dashboard (reuse, don't build new panel)**

- Desc: A view over `agent-perf` stats + journal + emitted cognitive traces (after Q1) showing bottlenecks found, optimizations proposed, latency trends.
- Value: measurable perf ROI.
- Reuse: `AgentStatsDashboard`, `LiveActivityStream`, journal.
- Effort: L. Risk: Low. Deps: Q1, Q3. Infra: AgentsPanel. Why now: makes perf work auditable.

**B3 — Auto-invoke `agent-perf` on perf regressions (policy-gated)**

- Desc: An Invocation policy (`source: 'module-event'`, e.g. a `latency` metric event) that summons `agent-perf` to analyze — authority stays human (D6) via policy allow/deny.
- Value: proactive perf engineering.
- Reuse: Invocation Engine + `phase21-invocation.ts` policy model.
- Effort: L. Risk: Med (needs a metric event source). Deps: metrics source. Infra: Invocation. Why now: closes the loop from measurement (B1) to action.
