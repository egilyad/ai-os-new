# SuperAgents OS — SERVICE REVIEW (Phase 4)

> Research-only. No source changed. Every recommendation references existing code via `file:line`.
> Companion files: `00_MASTER_IMPROVEMENT_MAP.md` (R-IDs), `PANEL_REVIEWS.md`, `HIDDEN_CAPABILITIES.md`, `CROSS_PANEL_OPPORTUNITIES.md`, `WORKFLOWS.md`.
>
> **Cycle 2 — services.** Investigated: research-engine-service, forum-service, scheduler-service,
> workflow-service, smart-routing-service, provider-router (RouterService), agent-service,
> template-sharing-service. (Memory/cognitive services covered lightly; deep-dive in HIDDEN_CAPABILITIES.)

---

## How to read this file

Each service gets: **Surface** (what it does), **Hidden/Underexposed** (what works but UI/glue doesn't use), **Gap**, **Recommendation** (→ R-id from master map). Priority: P0 highest.

---

## 1. ResearchEngineService — `src/kernel/services/research-engine-service.ts`

**Surface.** `IResearchEngine` is the single deepest capability gap in the product. `ResearchEngineService` (636 lines) implements it and **persists everything to `BucketStorageAdapter.RESEARCH`** (lines 106–181) — surveys, graphs, fact-checks, reports all survive reload. Public methods:

- `runLoop` (epistemic loop: search → extract claims → synthesize), `startSession`, `getAllSessions`
- `buildCitationGraph` / `buildKnowledgeGraph` (lines 374–406) — graph structures already computed
- `runSystematicReview` (PRISMA-style, line 408) — **backend-ready, zero UI**
- `runFactCheck` (line 427) — **backend-ready, zero UI**
- `detectAnomalies` (line 453) — **backend-ready, zero UI**
- `generateSummary` (extractive/abstractive/hybrid, line 469) — `ResearchPanel` uses this
- `generateCitations` (bibtex/apa/mla/chicago, line 499) — **backend-ready, zero UI**
- `runPeerReview` (line 515) — **backend-ready, zero UI**
- `runDiscovery` (cross-session insight, line 531) — **backend-ready, zero UI**
- `generateResearchReport` (full structured report, line 546) — used by `research-reports` panel

**Hidden/Underexposed.** The engine computes citation graphs, knowledge graphs, systematic reviews, fact-checks, anomaly reports, peer-review scores, and citation exports — **all persisted** — yet the UI (`research-engine`, `research-advanced`, `research-reports`) exposes only: sessions, loop summary, and the final report. The other 7 phase outputs exist but are unreachable from any panel.

**Gap.** Analyst-grade features (PRISMA systematic review, fact-check, peer-review sim, citation export, knowledge graph viz) are invisible. This is **R-01 (P0/M)** — the single highest-value "expose what exists" win in the whole system.

**Recommendation.**

- R-01: Add panels/tabs for `runSystematicReview`, `runFactCheck`, `detectAnomalies`, `runPeerReview`, `generateCitations(format)`, `buildKnowledgeGraph` on an existing session. Pure UI, backend done.
- R-14 (Research→Debate): `generateResearchReport` + `getConsensus`-style contested-claim detection → one-click "debate this claim" into the Debate runtime (reuse `debate-engine`).

---

## 2. ForumService — `src/kernel/services/forum/forum-service.ts`

**Surface.** `IForumService` is rich and fully implemented (407 lines), backed by `ForumRepository` (Dexie). Methods used by UI today: `createTopic`, `postMessage`, `listTopics`, `getThread`. Methods **implemented but with no UI**:

- `votePost(postId, voter, vote)` (line 149) — up/down with topic-score aggregation + idempotent toggle.
- `subscribe(topicId, subscriber)` (line 195) — subscription store (no notification UI).
- `pinTopic(topicId, pinned)` (line 237) — pin exists, no pin control in ForumPanel.
- `moderatePost(postId, 'warn'|'hide'|'remove', reason?)` (line 245) — full moderation, no UI.
- `getConsensus(topicId)` (line 262) — returns `consensus|contested|open` with confidence + Russian summary. **This is the natural escalation trigger.**

**Hidden/Underexposed.** Voting, pinning, moderation, and consensus-detection all work in the backend. ForumPanel renders threads but offers none of these actions. `event-registry` even has `FORUM_POST_VOTED`, `FORUM_TOPIC_PINNED`-style events; they're emitted (lines 187, 237) but no subscriber renders them.

**Gap.** Community/moderation loop is dead. `getConsensus` returning `contested` is the designed hand-off to Debate — but nothing calls it. This is **R-02 (P0/M)** + **R-03 (P0/M)**.

**Recommendation.**

- R-02: ForumPanel — vote buttons (call `votePost`), pin toggle (`pinTopic`), moderation menu (`moderatePost`) for authorized users. Backend-ready.
- R-03: On `getConsensus === 'contested'`, show "Escalate to debate" → invoke `debateService` (or `invocationEngine` with mode `debate`) seeded from the topic. Reuses existing event bridge `forum:topic:escalated-to-debate` mentioned in AGENTS.md Phase 6.
- R-15: `subscribe` → wire to `notification-webhook-service` / AlertLayer for "new reply" alerts.

---

## 3. SchedulerService — `src/kernel/services/scheduler-service.ts`

**Surface.** A genuine cron scheduler (527 lines): `create`, `update`, `delete`, `toggle`, `trigger`, `getDueSchedules`, `getUpcoming`, full 5-field cron parser + validator (`validateCron`, line 421). It runs a 60s `setInterval` heartbeat (`checkSchedules`) and persists schedules to `IDatabaseService` KV or `BucketStorageAdapter.AGENTS` (lines 69–99).

**Hidden/Underexposed (CRITICAL DEAD-END).** When a schedule is due, `runSchedule` (line 282) **only emits `EVENTS.SCHEDULE_TRIGGERED`** (line 300) with `{ scheduleId, agentId, taskParams }` — and **nothing in the codebase subscribes to `SCHEDULE_TRIGGERED`** (grep: only `event-registry.ts:1122` defines it + `scheduler-service.ts:300` emits it). So every schedule silently fires an event into the void. The scheduler _looks_ complete (Level 1–2 in master map) but **executes nothing**.

**Gap.** The single highest-leverage "wire what exists" fix in Phase 4. The payload (`agentId` + `taskParams.prompt`) is exactly what `InvocationEngineService.invoke()` needs.

**Recommendation.**

- R-13 (P2/S): Add a single subscriber (in `phase21-invocation.ts` or a new `scheduler-invocation-bridge`) that on `SCHEDULE_TRIGGERED` calls `invocationEngine.invoke({ target:{agentId}, reason: taskParams.prompt, context:{type:'scheduled'}, constraints:{mode:'chat'} })`. This turns the dead scheduler into periodic research digests / daily agent tasks — reusing Invocation + Agent registry, zero new runtime.
- Bonus: SchedulerPanel could let you pick the agent from `agentService.getAgents()` and `trigger()` manually (already supported).

---

## 4. WorkflowService — `src/kernel/services/workflow-service.ts`

**Surface.** `runWorkflow(workflowId, input, onProgress?)` (line 154) executes multi-step prompts through `adapterRegistry` + `keyService` (from `core-references`), interpolating `{{input}}` / `{{steps.N.output}}` variables. It persists **run history** (`runs`, capped at 50, lines 149–152, 86) and built-in workflows (`code-review`, `ADR` via `BUILT_IN_WORKFLOWS`). Supports `cancelRun`.

**Hidden/Underexposed.**

- Run history is fully stored (`getRuns()`) but the WorkflowPanel likely doesn't surface it (master map R-08).
- Workflow execution bypasses the agent/role/router system — it calls adapters directly with a fixed key lookup (`allKeys.find(k => k.provider === step.provider)`, line 198). It does NOT go through `RouterService` (so no latency/fallback/budget policy applies to workflows).

**Gap.** Workflows are real but isolated: no history UI, no router integration, no link to Scheduler (R-13) or Builder agent (which generates topologies, not workflows). **R-08 (P1/M)**.

**Recommendation.**

- R-08: WorkflowPanel — show `getRuns()` history with per-step status/latency/tokens (data already there); "save as template" → `template-sharing-service`; "schedule" → SchedulerService (R-13).
- R-08b: Route workflow steps through `RouterService` instead of direct `adapterRegistry` so cost/fallback/latency policies apply (medium effort, reuses existing `routerService` lazyService).

---

## 5. SmartRoutingService vs RouterService — the disjoint router (confirms nightly EB-24)

**Surface.**

- `SmartRoutingService` (`smart-routing-service.ts`, 178 lines): `addRule`, `updateRule`, `reorderRules`, `simulateRouting(request)` (line 101). **`simulateRouting` is a pure predictor** — it returns a `RoutingDecision` but the result is never applied to any live call. The only consumer of its output is the SmartRouting _panel_ (what-if display).
- `RouterService` (`provider-router.ts`, 510 lines): the **real** live router. It composes `RouterRankingService` which _does_ take `routingPolicyService` (line 144) — i.e. live routing is governed by `RoutingPolicyService`, **not** by `SmartRoutingService`. `RouterService.getDecisionHistory` (line 453) records _actual_ decisions.

**Hidden/Underexposed / Gap.** Two routers, two decision histories, zero connection. The SmartRouting panel implies it controls routing but it only simulates; live routing is driven by `RoutingPolicyService` (a third system). A user who adds a SmartRouting rule will see it "work" in the simulator yet have **no effect** on real calls. This is exactly nightly EB-24.

**Recommendation.**

- R-07 (P1/M): Bridge — make `RouterRankingService` / `RoutingPolicyService` ingest `SmartRoutingService` rules (or merge the two services). Minimal: have `SmartRoutingService.addRule` push into `routingPolicyService`. Then the panel's "Add rule" actually routes.
- OR (cheaper, honest): rename the panel to "Routing Simulator" and label clearly that it's a what-if preview, with a "Apply to live policy" button that copies rules into `RoutingPolicyService`. Avoids misleading users.

---

## 6. AgentService — `src/kernel/services/agent-service.ts`

**Surface.** 800-line `IAgentResolver` implementation. Beyond the registry (`getAgents`, `resolveAgent`), it holds:

- `AgentGroup` (line 27): `agentIds[]` + `executionPattern: 'parallel'|'sequential'|'consensus'|'pipeline'|'debate'` + `consensusThreshold`.
- `AgentStats` (line 15): per-agent calls/tokens/latency/errors/cost.
- `lifecycleStates` map.

**Hidden/Underexposed.** Agent **groups with execution patterns** (consensus/debate/pipeline) are a real orchestration primitive but (a) likely only creatable via a niche panel and (b) the Invocation Engine (`invocation-engine-service`) resolves single agents — it does _not_ leverage `AgentGroup` execution patterns. So a "debate group" defined in AgentService can't be invoked as a unit through Room/Invocation.

**Gap.** Agent groups are fragmented from Invocation/Room. **R-04 / R-10**.

**Recommendation.**

- R-04: Let `invocationEngine.invoke` accept a `target.kind: 'group'` that resolves an `AgentGroup` and runs its `executionPattern` (reuse `agentService` groups). RoomPanel "Invoke" could offer "Agent" or "Agent Group".
- R-10 (P2/M): Agent profile view = `getAgents` + `AgentStats` + journal (`agent-journal-service`) + `lifecycleStates` + marketplace entry, one unified page.

---

## 7. TemplateSharingService — `src/kernel/services/template-sharing-service.ts`

**Surface.** `ITemplateSharingService` with a seeded in-memory `SHARED_TEMPLATES` array (lines 11–70+): categories `debate`, `workflow`, `topology`, `prompt`, `agent`. Each has `content` (a DSL string), `downloads`, `imported` flag.

**Hidden/Underexposed.** This is a ready-made **template marketplace primitive** spanning all major artifact types — but it's a static module-level list (not persisted, no import-into-system wiring visible at a glance). The `imported` flag suggests an import flow that may be thin/absent.

**Gap.** Could be the backbone of **R-19 (P2/M)** (share workflows/agents/topologies) and a "starter templates" entry point for new users (R-16 onboarding).

**Recommendation.**

- R-19: Persist templates to Dexie, add import handlers that materialize a template into the real system (create workflow / spawn agent / load topology / seed debate). Reuse existing `WorkflowService.create`, `agentService`, `topology-manager`.
- R-16: Surface "Start from a template" on first run.

---

## 8. Memory backend (brief — deep-dive deferred)

Inventory (`src/kernel/services/memory/*`) shows an unusually rich memory subsystem: `semantic-memory`, `episodic-memory`, `working-memory`, `social-memory`, `procedural-memory`, `emotional-memory`, `spatial-memory`, `memory-palace`, `sleep-engine`, `memory-prune-scheduler`, `memory-quality-gate`, `memory-search-utils`, `service-backed-memory`, `federated-memory-service`. Master map rates Memory **2–3**. The cognitive depth here (emotional/spatial/procedural memory) far exceeds what `MemoryPanel`/`MemoryPalace` expose. Flagged for `HIDDEN_CAPABILITIES.md` deep-dive (R-09-adjacent, agent self-improvement).

---

## 9. Service-level cross-cutting findings (carry into Phase 6)

1. **Event-emit-but-no-subscriber pattern is systemic**, not just Forum/Scheduler. `SCHEDULE_TRIGGERED` (scheduler), `FORUM_POST_VOTED`/`PINNED`, `KEY_COMPROMISED` (nightly IN-06/UX-06), `forum:topic:escalated-to-debate` (AGENTS.md Phase 6 — "event bridge" listed but ForumPanel has no escalation UI). Each is a cheap "wire the event to a subscriber" win.
2. **Two parallel systems for the same concern**: SmartRouting vs RouterService (routing); `agentService` groups vs `invocationEngine` single-target (orchestration); `template-sharing` static list vs `workflow-service` persisted (templates). Consolidation = less confusion, more reuse.
3. **Backend-rich / UI-thin is the dominant pattern**: ResearchEngine (7 hidden phases), ForumService (4 hidden actions), AgentService groups, Scheduler (dead trigger), TemplateSharing (static). The leverage is overwhelmingly "expose + connect", not "build".

---

## 10. New / reinforced recommendations from this phase

| ID   | Title                                                                          | Pri | Effort | Evidence                                                                         |
| ---- | ------------------------------------------------------------------------------ | --- | ------ | -------------------------------------------------------------------------------- |
| R-21 | **Wire `SCHEDULE_TRIGGERED` → Invocation Engine**                              | P1  | S      | scheduler-service.ts:300 emits; no subscriber (grep)                             |
| R-22 | **Forum vote/pin/moderate UI**                                                 | P0  | M      | forum-service.ts:149/237/245 implemented, no UI                                  |
| R-23 | **Forum `getConsensus`→Debate escalation**                                     | P0  | M      | forum-service.ts:262 returns contested; no caller                                |
| R-24 | **Bridge SmartRouting rules → RoutingPolicyService** (or relabel as simulator) | P1  | M      | smart-routing-service.ts:101 vs provider-router.ts:144                           |
| R-25 | **Workflow run-history UI + router integration**                               | P1  | M      | workflow-service.ts:149 (`getRuns`) unused by panel; :198 bypasses RouterService |
| R-26 | **AgentGroup execution patterns exposed via Invocation/Room**                  | P2  | M      | agent-service.ts:25–35 group patterns unused by Invocation                       |
| R-27 | **Persist + import TemplateSharing marketplace**                               | P2  | M      | template-sharing-service.ts:11 static list                                       |

---

_Next file: `WORKFLOWS.md` (Phase 5 user-scenario research) → then `CROSS_PANEL_OPPORTUNITIES.md` (Phase 6) → `HIDDEN_CAPABILITIES.md` (Phase 7). SERVICE_REVIEW feeds R-21…R-27 into master map._
