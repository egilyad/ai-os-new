# Debate System Research

Research tooling for SuperAgents OS: agents inspect the project OS folder, codebase structure,
configs, and system metrics — then generate hypotheses for improvements in architecture, prompts,
model routing, and governance. Hypotheses can trigger automated debates to validate trade-offs,
and results are visualized in the RESEARCH nav section.

**Status: ✅ All 8 modules implemented (June 2026).**

**Files implemented:**
- `ProjectOsExplorer.tsx` (571 lines) — file browser, filter tabs, preview, stats
- `HypothesisGenerator.tsx` (403 lines) — CRUD, status lifecycle, debate link
- `ArchitectureReview.tsx` (307 lines) — scan engine, debt report parsing, findings grid
- `PromptAudit.tsx` (257 lines) — static audit, collision detection, suggestions
- `RoutingExperiments.tsx` (294 lines) — mock/real mode, results table, comparison
- `GovStressTest.tsx` (334 lines) — scenario runner, pass/warn/block, export
- `ObsGaps.tsx` (334 lines) — coverage scanner, events cross-ref, recommendations
- `DebateSystemResearch.tsx` (142 lines) — hub, navigation, recent hypotheses

**Services implemented:** `HypothesisService`, `ResearchRunService` (104 lines), `ArchitectureReviewService`, `PromptAuditService`, `RoutingExperimentsService` (187 lines), `GovStressTestService`, `ObsGapsService`.

---

## Global Goals

- [x] **Codebase introspection** — agents can read project structure (files, folders, configs, logs, docs)
  without exposing secrets/keys. Filterable by category (code, config, doc, metric).
- [x] **Hypothesis workflow** — agents generate structured hypotheses for improvements. Each hypothesis
  has a schema, status lifecycle, and links to source evidence.
- [x] **Debate-driven validation** — hypotheses trigger Debate Arena / Debate Runtime sessions.
  Outcomes are recorded and linked back.
- [x] **Visualization** — UI shows hypothesis list, argument graphs, metrics impact, and
  governance simulation results.

---

## Tasks by Module

### `debate-system-research` — Overview hub

Landing page for the RESEARCH section. Shows active hypotheses, recent debate outcomes, and
deep-links to all sub-modules.

- [x] Define the `ResearchHypothesis` data model:
  - Fields: `id, title, description, category (arch/prompt/routing/gov), status (proposed/active/debating/accepted/rejected), createdAt, sourceFile?, evidenceRefs[], linkedDebateId?, metricsDelta?`
  - Type in `src/kernel/types/domain-types.ts` (or new `research-types.ts`)
  - Keep it serializable (no class instances)
- [x] Wire hub to a read-only list of hypotheses (start with empty/dummy array from store)
- [x] Add deep-link cards/buttons to all 7 sub-modules (use existing nav icons and i18n keys)
- [x] Reference existing docs in sidebar hint: "See also: docs/DEBT_REPORT.md, docs/СОБЫТИЯ.md"
- [x] **Do not** create a new store: use Zustand `useResearchStore` only when data flows actually
  exceed 3-4 fields; start with simple React state + mock data

---

### `project-os` — Project OS Explorer

Lets agents (and humans) browse the project source tree — currently folders, files, and key metrics.

- [x] Define a **read-only** API/service for directory listing with safety rules:
  - Never expose: `.env*`, `*secret*`, `*key*`, `*token*`, `*password*`
  - Whitelist root: `src/`, `docs/`, `config/`, `prompt-vault/` (read from `window.showDirectoryPicker`
    or hardcoded project root)
  - Reuse existing `ConfigService` for config file reading
- [x] Add frontend component: path breadcrumbs + file list with filter tabs (Code / Config / Docs / Logs)
- [x] File preview: syntax-highlighted read-only view for text files; binary skipped
- [x] Integrate with existing `StorageAdapter` for caching directory snapshots
- [x] TODO: agents will consume this data via a service contract, see hypothesis-gen

**Safety guard:** all directory traversal goes through a validation function `isPathSafe(path): boolean`
that rejects any path containing `..`, or outside the whitelist.

---

### `hypothesis-gen` — Hypothesis Generator

Allows agents to propose structured hypotheses about the system.

- [x] Define API contract (`IHypothesisService` or just a function `proposeHypothesis(input) → Hypothesis`):
  - Input: `{ category, sourceFile?, description, evidenceRefs[] }`
  - Output: `ResearchHypothesis` with LLM-generated title, impact estimate, suggested debate topic
- [x] Add UI: hypothesis list with status badges, expand to see details + evidence links
- [x] Add "New Hypothesis" button → opens a form, optionally prefilled from project-os selection
- [x] Store hypotheses in existing `DexieService` keyValue table (reuse `DatabaseService.setKv/getKv`)
  — no new storage layer
- [x] Add "Start Debate on This Hypothesis" button (navigates to debate with prefilled thesis)
- [x] **Do not** call any LLM yet — the actual hypothesis generation is for the next phase.
  Mock it with a hardcoded example for UI development.

---

### `arch-review` — Architecture Review

Analyzes project structure for duplication, coupling, hot spots, and debt.

- [x] Define architectural rules/checks:
  - File size outliers (>500 lines), deep nesting (>4 directories), circular deps candidates
  - Cross-reference with `docs/DEBT_REPORT.md` findings (D-01 .. D-10)
  - Reuse `madge` config from D-10 for circular dep detection
- [x] Implement `ArchitectureReviewService` with methods `checkProjectStructure()`, `findDuplicates()`, `reportDependencies()`
  - All read-only — no mutations
- [x] Add UI: results grid with severity badges + file links that navigate to project-os
- [x] Connect to existing `DependencyMapPanel` data if available; don't duplicate service registry data

---

### `prompt-audit` — Prompt & Strategy Audit

Inspects prompts, argument strategies, and system messages used across agents and debates.

- [x] Inventory existing prompts/strategies:
  - Read from `topology-defaults.ts` (system prompts per agent)
  - Read from `debate-prompt-builder.ts` (ARGUMENT_STRATEGY_INSTRUCTIONS)
  - Read from any `role-service` role definitions
- [x] Define quality heuristics (all heuristic, no LLM calls):
  - Prompt length, instruction density, presence of key constraints
  - Argument strategy coverage (are all 10 strategies used? are they distinct?)
- [x] Add UI: table of prompts with quality scores, strategy distribution pie chart, repetition detector
- [x] Highlight collisions: two agents with nearly identical prompts
- [x] Suggested fixes: static analysis only (the "apply fix" feature comes later)

**Reference:** `docs/ПОЛНЫЙ_РЕЕСТР.md`, section 9 (kernel services) and section 10 (LLM adapters)
for the full list of places where prompts live.

---

### `routing-experiments` — Model Routing Experiments

Design and run A/B experiments on provider selection strategies.

- [x] Define `RoutingExperimentConfig` type:
  - `providers[]`, `models[]`, `temperatures[]`, `strategies[]`, `promptTemplate`, `runsPerCell`
  - Results: `{ provider, model, strategy, avgLatency, avgTokens, errorRate, cost, repetition, uniqueness }`
- [x] Add UI: experiment config form (multi-select providers/models/strategies), start button
- [x] Run experiment: iterate over the Cartesian product, call simplified `sendMessage` for each cell,
  collect metrics. Reuse existing `LLMClient.sendMessage` but with a **research flag** that skips
  persistence/caching.
- [x] Results table with sorting by any metric, color-coded best/worst per column
- [x] Export experiment results as JSON
- [x] Connect to `analytics` panel for historical comparison (future: add "compare with previous
  experiment" feature)

**Cost guard:** limit total runs to `n * 3` (max 3 per cell) and show estimated cost before starting.

---

### `gov-stress-test` — Governance Stress-Test

Simulates policy violations, SLA breaches, and security edge cases.

- [x] Enumerate existing policies/roles from:
  - `PolicyService.getPolicies()` — latency, privacy, cost, safety, rate-limit, content, custom
  - `RoleService.getRoles()` — role definitions with tool permissions
- [x] Define test scenario format: `{ name, policyToViolate?, slaMode?, simulatedAgents[], expectedBlock? }`
- [x] Implement simulation runner (pure computation, no real LLM calls):
  - For each scenario, checks if the current policy set would block/warn/pass
  - Output: `{ scenario, result: pass|warn|block, violatedRules[], suggestedMitigation }`
- [x] Add UI: scenario list with run button, results with pass/fail badges
- [x] Add "export governance report" button

**Limitation:** This is static simulation — it checks rules, it doesn't call LLMs. True
governance testing with real agent behavior is phase 2.

---

### `obs-gaps` — Observability Gaps Scanner

Scans the existing observability surface and finds blind spots.

- [x] Build an inventory of existing observability:
  - Logged events from `events.md` + `cognitive-events.ts` + `domain-events.ts`
  - Traces from `trace-service`
  - Health checks from `health-service`
  - Pressure signals from `pressure-map`
- [x] Define coverage rules:
  - Every kernel service with `init()`/`destroy()` should emit start/stop events
  - Every debate round should emit `debate:round:start` / `debate:round:end`
  - Every routing decision should be traceable back to a hypothesis (future)
- [x] Implement `ObsGapReporter`:
  - Checks which services emit events vs which don't
  - Flags services without `logger` usage
  - Reports ratio of instrumented vs non-instrumented code paths
- [x] Add UI: checklist with check/cross per service, gap % score, recommendations

**Reference:** `docs/ПОЛНЫЙ_РЕЕСТР.md`, section 11 (events — all 115 events)
and `docs/events.md` for the documented subset.

---

## Cross-Module Dependencies

```
project-os ──► hypothesis-gen ──► debate-system-research (hub)
    │                │
    ▼                ▼
arch-review    prompt-audit
                    │
                    ▼
           routing-experiments
                    │
                    ▼
           gov-stress-test
                    │
                    ▼
              obs-gaps (meta: scans everything)
```

No circular dependencies. Each module only depends on modules above it in the chain.
`obs-gaps` is a meta-scanner and depends on all others being partially implemented.

---

## Implementation Order

| Step | Module | Why First | Status |
|:-----|:-------|:----------|:-------|
| 1 | `project-os` | Foundation — agents need to read the codebase before generating hypotheses | ✅ |
| 2 | `hypothesis-gen` | Core workflow — hypothesis lifecycle is the central primitive | ✅ |
| 3 | `debate-system-research` (hub) | Makes all modules navigable, shows cross-cutting state | ✅ |
| 4 | `arch-review` | Consumes project-os data, adds structural analysis | ✅ |
| 5 | `prompt-audit` | Reads from topology/roles — needs hypothesis-gen for context | ✅ |
| 6 | `routing-experiments` | Needs prompts to create meaningful experiment cells | ✅ |
| 7 | `gov-stress-test` | Needs policies/roles — independent from prompt/routing work | ✅ |
| 8 | `obs-gaps` | Meta-scanner — benefits from all others existing | ✅ |

Each step: implement the backend first (service/contract), then the UI stub becomes real.
Keep each module <300 lines of new code per step.

---

## What NOT to Build

- **No new storage engine** — Dexie keyValue + SQLite config table cover all persistence needs
- **No new event system** — use existing EventBus with typed payloads from `events.md`
- **No LLM calls in the first pass** — all heuristics, no model dependencies
- **No VM/sandbox** — project-os is read-only file browsing, not execution
- **No real directory watcher** — manual refresh is fine for v1
