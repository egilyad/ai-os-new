# 11 — OPPORTUNITIES: `agent-ethics`

Each item: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (days)

**QW-1 — Ethics Review quick-action on AgentCard**

- Desc: A "⚖️ Ethics Review" chip opening Room (chat) pre-targeted to Elena with a review template.
- Value: One click to get an ethical read on anything.
- Reuse: `RoomPanel` + `invocation.ts` + seeded Manual Room policy (all exist).
- Effort: S. Risk: low. Deps: none. Infra: RoomPanel, phase21. Why now: zero backend change, pure UI.

**QW-2 — Journal name + ethics tag**

- Desc: Store display name + `ethics` tag in journal entries for Elena (reuse `record()` fields).
- Value: Readable, filterable ethics history.
- Reuse: `AgentJournalService.record` (`:206`), `resolveAgentIdentity`.
- Effort: S. Risk: low. Deps: none. Infra: agent-journal-service. Why now: trivial, fixes 08/10#5#6.

**QW-3 — Debate emits COGNITIVE_STEP_COMPLETED**

- Desc: Debate runtime emits the existing event for participant steps (nodeId=agent-ethics).
- Value: Elena's debate reasoning becomes visible + journaled.
- Reuse: existing event + `AgentService`/`AgentJournalService` consumers.
- Effort: S. Risk: med (event volume). Deps: none. Infra: event-registry, debate-orchestrator. Why now: closes 10#3#4 with no new consumer.

**QW-4 — Ethics badge in Debate participant picker**

- Desc: Auto-suggest Elena as "⚖️ Ethics audit" when topic matches ethics keywords (reuse `persona-selector.ts` keyword sets).
- Value: Users discover her for moral/policy topics.
- Reuse: `persona-selector.ts:27-48,74-96,148-170` keyword arrays.
- Effort: S. Risk: low. Deps: none. Infra: debate UI + persona-selector. Why now: pure UI.

**QW-5 — Preset "Ethics Review" Director scenario**

- Desc: Library template pre-populating Elena + structured-verdict turn instruction.
- Value: Repeatable, governed ethics review.
- Reuse: `ScenarioRepository`, `ConversationDirectorService` (B3/B5).
- Effort: S. Risk: low. Deps: none. Infra: Director Library. Why now: config-only.

## 5 MEDIUM (1–3 weeks)

**MED-1 — Structured ethical verdict contract**

- Desc: Elena returns risks / responsible alternative / named framework; parser extracts to journal tags.
- Value: Auditable, queryable ethics outputs.
- Reuse: parse style of `bias-profiler.ts` / `debate-metrics.ts:480-519` ethical_framework scoring.
- Effort: M. Risk: med (prompt reliability). Deps: QW-2. Infra: agent-journal, debate-metrics. Why now: turns her from chat into a verifiable reviewer.

**MED-2 — Bind bias-profiler + ethical_framework to her**

- Desc: When Elena is a debate participant, force the `ethical_framework` constraint and feed `bias-profiler` output into her turn.
- Value: Her specialization actually drives behavior.
- Reuse: `debate-prompt-constants.ts:37,55`, `bias-profiler.ts`, `debate-llm-prompt-context.ts:514`.
- Effort: M. Risk: med. Deps: none. Infra: debate runtime. Why now: reuses built-but-idle machinery.

**MED-3 — Ethics filter in LiveActivityStream / JournalPanel**

- Desc: Filter cognitive/journal feed by agent or `ethics` tag.
- Value: Ops can watch ethics activity.
- Reuse: `LiveActivityStream.tsx`, `AgentJournalPanel`, `AgentHistoryTab`.
- Effort: M. Risk: low. Deps: QW-2. Infra: AgentsPanel. Why now: cheap observability win.

**MED-4 — Auto-ethics-review policy (Invocation)**

- Desc: Policy `match:{source:'human-mention', expertise:['Ethical Reasoning','Policy','Bias Audit']}` → Elena, chat mode, preset instruction.
- Value: `@ethics` style routing without engine change.
- Reuse: policy model `invocation.ts:55-73` (already supports `match.expertise`).
- Effort: M. Risk: low. Deps: none. Infra: phase21. Why now: policy-only.

**MED-5 — Ethics Lens in lens-library**

- Desc: Add `lens:ethics` (fairness/transparency/accountability/questions) and attach to Elena's `lensIds`.
- Value: Synthesis/Lens machinery auto-applies ethics perspective.
- Reuse: `lens-library.ts` shape; `normalizeAgentIdentity` sets `lensIds`.
- Effort: M. Risk: low. Deps: none. Infra: lens-engine. Why now: fills 10#7 gap.

## 3 BIG IDEAS (months)

**BIG-1 — Institutional Ethics Memory (Crystal bridge)**

- Desc: Finalized ethical verdicts crystallize into Knowledge Crystals; future reviews retrieve them.
- Value: Organization learns its own ethical precedents.
- Reuse: CrystalVault + bridge pattern (AGENTS.md Module 2), `AgentJournalService`.
- Effort: L. Risk: med. Deps: MED-1. Infra: crystal-vault, generator. Why now: turns one-off reviews into assets.

**BIG-2 — Gatekeeper role across modules**

- Desc: Elena auto-reviews crystallized insights, forum consensuses, and deployed workflows before they "ship".
- Value: Responsible-AI gate built-in, not bolted on.
- Reuse: Forum/Crystal/Builder event bridges (AGENTS.md Modules 2/6/7), Invocation engine.
- Effort: L. Risk: high (latency/governance). Deps: MED-1, BIG-1. Infra: all module bridges. Why now: highest-leverage ethics integration.

**BIG-3 — Debate "Ethics Auditor" seat type**

- Desc: New first-class debate role `ethics-auditor` (neutral, mandatory verdict) that Elena fills by default; finalizer cites her memo.
- Value: Every moral/policy debate gets a structured ethics check by design.
- Reuse: `debate-meta-agent` role system, finalizer (`debate-finalizer.ts`), `ethical_framework` constraint.
- Effort: L. Risk: med. Deps: MED-2. Infra: debate-runtime. Why now: makes ethics a structural guarantee.
