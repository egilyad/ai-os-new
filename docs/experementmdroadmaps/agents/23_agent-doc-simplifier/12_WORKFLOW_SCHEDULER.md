---
title: Workflow & Scheduler Modules — agent-doc-simplifier
status: VERIFIED (N/A)
agent_id: agent-doc-simplifier
---

# 12 — WORKFLOW / SCHEDULER: participation

## Finding (VERIFIED, N/A)

`agent-doc-simplifier` has **no participation** in the Builder Agent (Workflows)
or any Scheduler subsystem. Same negative grep evidence as `10`/`11`.

## Builder Agent (VERIFIED, context)

- `builder-agent-service` (`AGENTS.md` Module 7) generates topologies from prompts,
  validates DAGs, compiles manifests, deploys flows. It is a _separate_ agent
  (`agent-builder` if present) — not doc-simplifier.
- A compiled `CompiledFlow` could, in principle, include `agent-doc-simplifier` as
  a node if a user's prompt produced such a topology, but no seeded flow does, and
  nothing binds doc-simplifier to the Builder.

## Scheduler (VERIFIED, context)

- The Invocation Engine design notes mention `schedule` triggers as a _future_
  hybrid trigger (D2, `AGENTS.md` Invocation Engine design) but they are **not
  implemented** (Step 6 scope deferred schedule triggers).
- No cron/scheduler service references this agent.

## Opinion

Workflow and scheduled invocation of doc-simplifier are plausible future
integrations but currently absent. Marked N/A.
