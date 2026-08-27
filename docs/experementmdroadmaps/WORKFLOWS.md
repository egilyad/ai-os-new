# SuperAgents OS — WORKFLOWS (Phase 5)

> Research-only. Traces real end-to-end user scenarios through existing code/panels/services,
> flagging friction and the missing connector that would make the journey cohesive.
> Companion: `SERVICE_REVIEW.md`, `PANEL_REVIEWS.md`, `CROSS_PANEL_OPPORTUNITIES.md`.
>
> **Cycle 2 — workflows.** 8 core journeys traced. Friction tagged with prior nightly findings
> (EB-/FE-/IN-/UX-/CH-) where applicable; recommendations map to R-ids.

---

## W1 — "Hold a debate" (Debate domain)

**Happy path.** `DebatePanel` → configure participants/topology → `debateService` starts a session → `debateLiveStore` + `activeDebateStore` receive `debate:updated` → live transcript renders.

**Friction.**

- **Single active session** (EB-15): opening a second debate replaces the first; no multi-session browser.
- **Lossy `debate:updated`** (EB-17): live store can miss deltas → stale transcript requiring manual refresh.
- ~30 debate sub-service panels are `ComingSoonPanel` stubs (steelman, bayesian-judge, blind-eval, credibility, calibration, consistency, frame-tracker, stance-drift, insight-bus…) — the panel surface over-promises (R-17).

**Connector.** A unified Debate list/replay with reliable subscription (fix EB-17 at the store). Reuse existing `DebateReplayPanel` + `temporal-replay-service`.

---

## W2 — "Research a topic" (Research domain)

**Happy path.** `ResearchPanel` → `startSession` → `runLoop` (search→claims→synthesis) → `generateSummary` / `generateResearchReport` → report view.

**Friction.**

- After the loop, only `generateSummary` and `generateResearchReport` are reachable from UI. The engine also computes **citation graph, knowledge graph, systematic review, fact-check, anomaly report, peer review, citation export, discovery** — none reachable (R-01, R-22-equivalent for research).
- No "turn a contested research claim into a debate" action (R-14).

**Connector.** Expose the 7 hidden phases as tabs on an existing research session view. Pure UI; backend done (`research-engine-service.ts:374–544`).

---

## W3 — "Invite an agent into a room" (Room / Invocation)

**Happy path.** `RoomPanel` → pick agent (friendly `<select>` of `agentService.getAgents()`) → Where/Mode/Task → `invocationEngine.invoke(req)` → lifecycle `requested→accepted→executing→done`; live `conversation:*` feed renders; `Open session` deep-links to Director/Debate.

**Friction (nightly).**

- **FE-07 unscoped feed**: the live-output feed is not scoped to the active invocation/session, so unrelated events pollute it.
- **FE-06 misleading "Clear"**: clears the local view but persisted invocations remain (history is separate).
- **UX-05 status over-promises for `debate` mode**: Room shows "done" before the debate session truly settles.
- **FE-09 checkpoint-list staleness** (Director side) leaks into Room's session view.

**Connector.** A shared `SessionScopedStore` pattern (R-06) so every live feed is keyed by `sessionRef`. Fix Clear vs History semantics. Scope status to the real execution target.

---

## W4 — "Moderate a community forum" (Forum)

**Happy path.** `ForumPanel` → list topics → open thread → read posts.

**Friction (nightly IN-01/02/03).**

- No **vote** UI (`votePost` exists, forum-service.ts:149).
- No **pin** control (`pinTopic` exists, :237).
- No **moderation** menu (`moderatePost` warn/hide/remove exists, :245).
- No **escalate-to-debate** when `getConsensus` returns `contested` (:262).
- `subscribe` exists (:195) but no notification surface.

**Connector.** R-22 (vote/pin/moderate UI) + R-23 (consensus→debate escalation). All backend-ready.

---

## W5 — "Automate a recurring agent task" (Scheduler)

**Happy path (intended).** `SchedulerPanel` → create schedule (agent + cron + prompt) → due → agent runs.

**Friction (CRITICAL, this research).**

- `SchedulerService.runSchedule` only **emits `SCHEDULE_TRIGGERED`** (scheduler-service.ts:300). **Nothing subscribes** (grep confirms only definition + emit). Schedules are a dead-end — the agent never runs (R-21).

**Connector.** One bridge: on `SCHEDULE_TRIGGERED` → `invocationEngine.invoke({ target:{agentId}, reason: taskParams.prompt, context:{type:'scheduled'}, constraints:{mode:'chat'} })`. Turns the dead scheduler into daily research digests / periodic agents. Reuses Invocation + Agent registry (R-13).

---

## W6 — "Build & run a workflow" (Builder + Workflow)

**Happy path (intended).** `BuilderAISidebar` generates a topology from a prompt → `builder-agent-service` compiles → `WorkflowPanel` lists/run.

**Friction.**

- Builder outputs **topologies** (DAG of agents); `WorkflowService` runs **linear step pipelines** calling adapters directly. The two are disjoint — Builder's output isn't consumable as a Workflow and vice-versa (R-08).
- `WorkflowService.runWorkflow` bypasses `RouterService` (workflow-service.ts:198 direct key lookup) → no cost/fallback/latency policy on workflows.
- Run history IS stored (`getRuns`, :149) but `WorkflowPanel` doesn't show it.

**Connector.** R-08: show run history; add "save as template" (`template-sharing-service`) and "schedule" (R-21→Scheduler). Optional R-25b: route workflow steps through `RouterService`.

---

## W7 — "Escalate a contested claim to a debate" (Forum → Debate)

**Intended cross-module journey.** Forum thread gains dissent → `getConsensus` → `contested` → one click → Debate seeded from the thread.

**Friction.** The bridge exists only as an _event name_ (`forum:topic:escalated-to-debate`, AGENTS.md Phase 6 "event bridge") and a `getConsensus` method. No UI triggers it, no code path calls `getConsensus`, and `debateService` isn't invoked from Forum. **This is the flagship broken cross-module journey** (R-03/R-23).

**Connector.** ForumPanel "Escalate to debate" button → compute `getConsensus`; if `contested`, call `invocationEngine.invoke({mode:'debate', context:{type:'forum-topic', ref: topicId}, reason: topic.title})`. Reuses Invocation (already handles debate mode) + the existing event name.

---

## W8 — "Compose knowledge from analysis" (Lens → Synthesis → Crystal → Forum)

**Intended cognitive pipeline.** Apply a Lens → Synthesize perspectives → Crystallize a claim → Discuss in Forum.

**Friction.** Each module has its own UI + persistence (LensesPanel, SynthesisPanel, CrystalVaultPanel, ForumPanel) but the **bridges are thin/manual**: a lens result must be copy-pasted into Synthesis; a synthesis must be manually proposed as a Crystal; a Crystal isn't auto-posted to Forum. AGENTS.md notes `crystal-debate-bridge` (auto-propose from verdicts) exists — a good pattern to extend (R-09).

**Connector.** R-09: auto-bridge each stage (event-driven): Lens `lens:applied` → suggest Synthesis; Synthesis `zone:consensus` → suggest Crystallize; Crystal `formed` → post announcement to Forum (the `knowledge:crystal:formed`→announcement bridge already exists in Phase 6 — extend it to auto-create a Forum topic).

---

## Cross-workflow insight

Every broken journey is a **missing connector between two existing, working subsystems**:

- W3/W5/W7: Invocation/Room is the natural _hub_ — agent tasks, scheduled runs, and forum escalations should all enter through `invocationEngine.invoke`. Today only W3 uses it.
- W2/W8: Research + cognitive modules are backend-rich but terminal — they need an "export to next module" action.
- W1/W4/W6: each domain is solid in isolation but doesn't hand off.

**Leverage ranking:** W5 (scheduler dead-end) and W7 (forum→debate) are the cheapest high-value connectors (backend complete, need 1 bridge each). W2 (research phases) is the biggest single expose. W8 is the most strategically valuable cohesion play.

---

_Next: `CROSS_PANEL_OPPORTUNITIES.md` (Phase 6) — synthesize the connector map across all panels._
