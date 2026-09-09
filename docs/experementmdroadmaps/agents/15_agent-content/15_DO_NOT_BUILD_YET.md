# 15 — DO NOT BUILD YET (ideas to AVOID for `agent-content`)

> Guardrails. Building these now would violate the architecture or waste effort. Each notes the warning from AGENTS.md: **avoid 25 mini-frameworks.**

## ❌ 1. A dedicated `ContentAgentService` in the kernel

- **Why avoid:** AGENTS.md explicitly states agents are topology NODES and behavior is SHARED infra; "no agent-specific service." A `ContentAgentService` would be a 26th code path and the start of per-agent services for all 25 agents.
- **Instead:** Compose via lens + tools + Director scenario + memory (Philosophy A).

## ❌ 2. A separate content database / Dexie tables for "Lena's drafts"

- **Why avoid:** Memory store + AgentJournal already capture outputs (memory-engine.ts:181; agent-journal-service.ts). New tables duplicate them and add a migration/maintenance burden. The schema is already at v20.
- **Instead:** Tag memory entries `source:'agent-content', type:'content'` (reuse existing `metadata`).

## ❌ 3. Auto-publishing to external CMS/social without human authority

- **Why avoid:** INVOCATION_ENGINE.md D6: "Authority = human; agents never self-invoke." Uncontrolled publishing is a reputational/compliance risk.
- **Instead:** Publish to internal Forum for human review (forum-service); keep external publish behind an explicit human click.

## ❌ 4. A bespoke content UI framework (editor, calendar, CMS adapters) from scratch

- **Why avoid:** Reinvents what DirectorPanel/ForumPanel/RoomPanel/BuilderPanel already provide. Directly feeds the "25 mini-frameworks" anti-pattern.
- **Instead:** Render content in existing panels; add thin content cards/tabs only.

## ❌ 5. Hard-coding `agent-content` into debate or pipeline logic

- **Why avoid:** Breaks the generic-agent contract; any content persona should benefit the whole `Creative` group (agent-creative/designer/ux) via `suitableRoles`+keyword gating (persona-selector.ts), not a hardcoded id.
- **Instead:** Gate via persona keywords / audit group (04_DEBATE_ROLE).

## ❌ 6. Forcing `agent-content` to be the "only" content agent

- **Why avoid:** `agent-creative` (Brand), `agent-writer` (Docs), `agent-doc-*` (Documentation) overlap. A forced monopoly creates arbitrary boundaries and duplicate capabilities.
- **Instead:** Let the `Creative` group share content skills (lens/tools) and differentiate by prompt.

## ❌ 7. Building a content quality ML model

- **Why avoid:** Out of scope for an agent-runtime repo; a heuristic scorer (QW-1) covers 80% of value. An ML ranker is a research project, not an agent feature.
- **Instead:** Heuristic readability/SEO; plug a model later behind the same scorer interface.

## ❌ 8. Making `agent-content` autonomously spawn clones / self-improve

- **Why avoid:** Auto-spawn exists for load (agent-service.ts:614-665) but self-improvement loops are unvalidated and risk runaway cost + identity drift.
- **Instead:** Human-driven AgentWizard cloning + memory-based continuity (MED-1).

## ❌ 9. New content-specific cognitive events that duplicate `COGNITIVE_STEP_*`

- **Why avoid:** There are already 4 cognitive events; `COGNITIVE_DECISION_MADE` is dead. Adding `content:draft:*` etc. fragments the stream. Fix the dead one first (07).
- **Instead:** Surface content semantics via tags on the existing `COGNITIVE_STEP_COMPLETED` + the decision event.

## ❌ 10. Treating specializations as a routing engine

- **Why avoid:** `Editorial/SEO/Messaging` are metadata today (10_P5). Building a specialization-based router before they're behaviorally meaningful creates a fake taxonomy.
- **Instead:** First make them actionable (chips, lens, policy expertise-match MED-5), then consider routing.

## Guiding rule

> If a feature can be expressed as a **generic agent-infra primitive** (lens, tool, objective type, policy, UI tab, memory tag) that `agent-content` _uses_, build the primitive. If it requires a **content-only service, table, or event**, do NOT build it yet — it is the start of a 26th framework.
