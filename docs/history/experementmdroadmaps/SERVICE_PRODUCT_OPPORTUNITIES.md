# SERVICE PRODUCT OPPORTUNITIES

> For each major service: what it provides, what data it produces, who consumes it, who SHOULD, hidden
> capabilities, UI that could expose it, composition, workflows. Build on prior `SERVICE_REVIEW.md`
> (Cycle 2, covered Research/Forum/Scheduler/Workflow/SmartRouting/Agent/TemplateSharing/Memory-brief).
> Cycle 3 adds the **core infrastructure** + **cross-cutting** + flags the **7 cognitive modules** as
> unreviewed. Preference: EXISTING SERVICE → EXISTING DATA → EXISTING EVENT → NEW UX. No rewrites.

## A. CORE INFRASTRUCTURE (newly reviewed, Cycle 3)

### A1. EventBus — `src/kernel/events/event-bus.ts` (VERIFIED)

- **Provides:** typed pub/sub; `publish`/`emit` (130), `subscribeAll` (279), `onSafe` (285, validates
  payloads), `clearAllSubscriptions` (135). All events Zod-validated (`EventValidators`).
- **Produces:** every `EVENTS.*` payload + self-emits `EVENTBUS_BACKPRESSURE` (340-410).
- **Consumes:** directorStore, invocationStore, key-state-store (609), memory-engine (101/171),
  debate runtime, ~97 subscription sites. **It is the single integration backbone.**
- **Hidden (VERIFIED):** `subscribeAll` (279) is the perfect hook for a system-wide firehose view; no
  panel uses it today. Replay buffer was _deliberately removed_ (67-69) to kill a 100MB leak → no
  replay(), but `eventLog` Dexie table persists an audit trail.
- **UI:** a "System Event Inspector" rendering live `debate:*`/`conversation:*`/`invocation:*` — humans
  currently only see this in logs. Also powers the Mission-Control cockpit + Audit Log (see BIG_IDEAS).

### A2. Container — `src/kernel/container.ts` (VERIFIED)

- **Provides:** DI; `register`/`override` (59)/`get`/`getDependencies` (26)/`getServices` (27). Enforces
  "no globals in kernel."
- **Hidden (VERIFIED):** `override()` + `clear()` enable deterministic test swapping; `getDependencies()`
  exposes the full 352-service wiring graph — perfect for tooling.
- **UI:** a hidden "Service Graph" debug panel calling `getServices()` to visualize wiring + flag
  unregistered tokens. Onboarding/debugging gold.

### A3. Dexie Schema / DatabaseService — `src/kernel/services/dexie-schema.ts` (VERIFIED)

- **Provides:** 20 progressive schema versions (v5→v20). Tables include `crystals, crystalVersions,
junctions, synthSessions, synthPerspectives, genJobs, forum*, workflows, scenarios, invocations,
invocationPolicies, eventLog` (1229-1263).
- **Hidden (VERIFIED):** migration loop _warns_ (LOGGER.warn) when a table/index changes between
  versions — that data is only logged, never shown. v20 added exactly `invocations`+`invocationPolicies`
  (additive, no `.upgrade()`).
- **UI:** a "Data / Storage" admin page (row counts, DB size, schema version, migration warnings).

### A4. KeyStateStore — `src/kernel/services/key-state-store.ts` (VERIFIED)

- **Provides:** live per-key health + routing eligibility. `ingestProbe` (626) classifies 401/402/403 →
  `flags.authFailed`; `getForRouting` (548) excludes `authFailed` (weight 0). `authFailed` preserved
  across `KEY_UPDATED` (263-272) so a 402 key isn't resurrected.
- **Hidden (VERIFIED):** emits `KEYSTATE_UPDATED` (593/609) — a dashboard could render live key status
  reactively. Today this state only surfaces in debate logs.
- **UI:** "Key Health / Routing" board (active / rate-limited / 402-blocked / circuit-open).

### A5. MemoryEngine — `src/kernel/services/memory-engine.ts` (VERIFIED)

- **Provides:** unified memory mesh. `search` (616, auto|semantic|fulltext via Web Worker), `recall`
  (792), `getStats` (681), `getCapabilities` (781: 50MB cap, TTL, prune).
- **Hidden (VERIFIED):** semantic search lazy-enabled with embedding backfill; `setupListeners` (174)
  **auto-stores** cognitive decisions on `COGNITIVE_STEP_COMPLETED` (181-189) — memory builds passively.
- **UI:** surface semantic-vs-keyword mode, `getStats()` (prune/quality), the auto-ingested decision
  stream; expose capabilities (cap, TTL). Feeds Memory→Invocation continuity (COMPOSITION #3).

### A6. AdvisorService — `src/kernel/services/advisor-service.ts` (VERIFIED)

- **Provides:** 51-method SRE/optimization advisor. `getSuggestions` (269), `getSREAlerts` (275),
  `executeFix` (282, one-click remediation), `getPressureSnapshot` (287), **what-if** simulators
  `analyzeAddKey`/`analyzeSwitchProvider`/`analyzeBudgetChange` (324-330), `generateReport` (345).
- **Hidden (VERIFIED):** the pressure-map + what-if engine is real but **effectively dormant** — runs
  `startPeriodicAnalysis` (163) but drives no automated action / no exposed console.
- **UI:** an **SRE console**: suggestion list + one-click `executeFix`, live pressure heatmap,
  interactive what-if (add key / switch provider / change budget). Huge reuse, near-zero new infra.

## B. COGNITIVE MODULES (flagged UNREVIEWED in SERVICE_REVIEW — Cycle 3 note)

All seven are implemented + UI-wired but were absent from `SERVICE_REVIEW.md`. Each produces events
that are largely **dark** (see SURPRISE_DISCOVERIES):

- **lens-engine** — perspective/lens library. Feeds Synthesis.
- **crystal-vault** — knowledge-crystal lifecycle (propose/crystallize/supersede/refute). `crystal:formed`
  → Forum LIVE; `superseded`/`refuted` DARK.
- **junction-engine** — contradiction/bridge detection. `junction:*` DARK.
- **synthesis-engine** — multi-perspective synthesis + zones. `exported-to-crystal/forum` DARK.
- **knowledge-generator** — hypothesis→evidence→crystallize jobs. `GENERATOR_*` DARK.
- **builder-agent-service** — prompt→topology→compiled workflow. `builder:flow:deployed` DARK.
- **conversation-director-service** — generic ConversationCore director. UI-wired via DirectorPanel;
  emits `conversation:*` (consumed by directorStore).

**Product opportunity:** the cognitive chain is _mostly built but mostly unconnected_. The highest-leverage
service work is **adding subscribers**, not new engines (see COMPOSITION_OPPORTUNITIES + BIG_IDEAS A3/A6).

## C. CROSS-CUTTING SERVICES flagged for future deep-dive

- **RouterService + RoutingPolicyService + SmartRoutingService** — two routers, disjoint; unify (B3).
- **key-intelligence-pipeline / probe-service / key-usage-analytics-service** — credit classification +
  usage; feed Key Health board (A4) + per-invocation cost (COMPOSITION #4).
- **pricing-service / budget-service / budget-alert** — `estimateCost`, `budget:alert`; correlate to
  invocations (COMPOSITION #4).
- **execution-governor** — timeout/backpressure; already hardened (AGENTS.md); expose pressure snapshots.

## D. WHO SHOULD CONSUME WHAT (composition seeds)

| Service                             | Should also be consumed by                                   |
| ----------------------------------- | ------------------------------------------------------------ |
| EventBus.subscribeAll               | Audit Log service, Mission-Control cockpit, Event Inspector  |
| AdvisorService                      | SRE console (AlertLayer), budget-service planning            |
| MemoryEngine                        | Invocation delegate (inject agent memory), AgentJournalPanel |
| KeyStateStore                       | Key Health board, AlertLayer (KEY_COMPROMISED)               |
| Generator/Junction/Synthesis events | Audit Log + Forum + Crystal auto-bridges                     |
| SchedulerService                    | SchedulerPanel (real) + Invocation bridge                    |

## E. REUSE, DON'T REBUILD

- Don't add a bus (X1); add subscribers to EventBus.
- Don't rewrite RouterService (X3); bridge SmartRouting.
- Don't build notification infra (X11); reuse `system:notification`.
- Don't build deploy console (X12); subscribe to `builder:flow:deployed`.
- Don't rewrite Scheduler (X13); wire existing `schedulerService`.

## F. ADVISOR SERVICE — deep-dive confirmation (Cycle 3, VERIFIED)

`advisor-service.ts` (14757 bytes) confirms the "dormant SRE engine" claim:

- Injected deps `optimizer` + `whatIf` provide the real logic; `startPeriodicAnalysis` (163) calls
  `performDeepAnalysis` (234) on an interval (gated by `analysisIntervalMs`).
- Public surface verified: `getSuggestions` (269), `getSREAlerts` (275), **`executeFix`** (282 —
  one-click remediation), `getPressureSnapshot` (287), what-if simulators `analyzeAddKey` (324) /
  `analyzeSwitchProvider` (327) / `analyzeBudgetChange` (330) / `getPromptCachingAdvice` (333),
  `generateReport` (345).
- **Hidden:** the pressure-map + what-if + one-click-fix machinery is fully built but drives **no UI and
  no automated action** today. This is the strongest "free amazing feature" in the codebase: an SRE
  console (BIG_IDEAS A10) is mostly _rendering existing method results_.

## G. MEMORY SUBSYSTEMS — verified inventory (Cycle 3, VERIFIED)

`src/kernel/services/memory/` contains a deep, specialized mesh (none surfaced in prior review):
`emotional-memory`, `episodic-memory`, `procedural-memory`, `semantic-memory`, `social-memory`,
`spatial-memory`, `working-memory`, `sleep-engine`, `memory-prune-scheduler`, `memory-quality-gate`,
`federated-memory-service`, `memory-palace`, `service-backed-memory`, `memory-cache`,
`memory-search-utils`, `memory-worker-client`. Plus `MemoryEngine` (`memory-engine.ts`) unifies them.

- **Implication for A7 (Memory→Invocation):** the raw material for agent continuity + self-improvement
  loops already exists; the only missing piece is a _consumer_ that injects agent-scoped entries into an
  invoked session (delegate/executor change + UI toggle). Feeds the prior "agent self-improvement" bet.
- **UI gap:** `MemoryPanel`/`MemoryPalacePanel` show only a thin slice; the specialized stores +
  `getStats()`/`getCapabilities()` (50MB cap, TTL, prune/quality) are invisible.

## H. ROUTING / KEY / COST cross-cutting (verified present, flagged for deep-dive)

- `routing-policy` + `router-ranking` + `provider-tracker` + `execution-governor` exist alongside
  `RouterService` + `SmartRoutingService` (the orphan). Unification = B3.
- `key-intelligence-pipeline` + `probe-service` (`isCreditError`) + `key-usage-analytics-service` feed
  `KeyStateStore` (A4) + per-invocation cost (N4).
- `pricing-service` (`estimateCost`) + `budget-service`/`budget-alert` (`budget:alert`) → cost
  attribution + SRE what-if inputs.
