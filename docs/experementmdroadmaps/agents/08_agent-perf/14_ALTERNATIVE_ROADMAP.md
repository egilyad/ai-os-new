# 14_ALTERNATIVE_ROADMAP — Second philosophy (contrast to `13_ROADMAP.md`)

**Philosophy B: "Agent-as-Service / Micro-performance-platform"** — instead of compositional reuse, build a _dedicated Performance subsystem_ that owns perf tooling, metrics, and a perf dashboard as a first-class module (parallel to Lenses/Crystal/Forum).

## Trade-offs vs Roadmap A (compositional)

| Dimension                            | A (compositional, `13_ROADMAP`)                       | B (dedicated subsystem)                                       |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| New services                         | None until P3 (tool only)                             | New `PerformanceService`, `PerfMetricsStore`, `PerfDashboard` |
| Consistency with architecture        | ✅ honors shared-infra / no-globals / dependency rule | ⚠️ risks a 26th mini-framework (see `15`)                     |
| Time to first value                  | Fast (Q1–Q3 ship in days)                             | Slow (must stand up module + UI + schema)                     |
| Measurement depth                    | B1 tool only                                          | Deeper: native metrics ingestion, trend DB                    |
| Coupling                             | Reuses Debate/Director/Invocation/Crystal             | May duplicate invocation/execution logic                      |
| Maintenance                          | Shared (one fix helps all agents)                     | Siloed (perf bugs isolated but also isolated fixes            |
| Fit with "25 agents are nodes" model | ✅ agent stays a node                                 | ⚠️ implies agent ≠ node, special-cased                        |

## When B would be justified `[OPINION]`

Only if measurement depth becomes a product pillar: e.g. the org needs historical latency trending, SLA tracking, multi-endpoint benchmark suites, and perf regression alerting as a standalone feature — not just "an agent that talks about performance." Then a `PerformanceService` (+ Dexie `perfMetrics` table, + `perf:` events, + `PerfPanel`) mirrors the established Module pattern (Lenses→Forum). That is the _only_ clean way to do B without violating AGENTS.md.

## Hybrid recommendation `[OPINION]`

Start with **A** (Phases 0–2). If, after A ships, demand for deep metrics proves real, extract B's `PerformanceService` **as a module** following the exact Lenses/Crystal contract pattern (contracts in `contracts/`, impl in `services/`, Dexie table, events, phase registration) — do **not** special-case `agent-perf` in kernel code. This keeps the dependency rule and avoids a 26th panel.

## Risk of choosing B too early

- Premature schema/event proliferation (a `perfMetrics` vN table, `perf:*` events) that may be abandoned.
- Duplicates Invocation/Execution handoff already solved in `phase21-invocation.ts`.
- Violates "Agents are topology NODES; behavior is SHARED infra" (AGENTS.md).
