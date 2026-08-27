# ROOM ROADMAP (Phase 13 — Room / Invocation)

> Research-only. RoomPanel + Invocation Engine is the **hub** of the product (see CROSS_PANEL_OPPORTUNITIES C1–C4).
> Current state, gaps (file:line), phased roadmap, value/effort.
>
> **Cycle 2 — panel roadmap: Room.**

## Current state

- `RoomPanel.tsx` (rewritten, human-facing): agent picker, Where/Mode/Task, invocations list with Details toggle, `Open session` deep-link.
- `invocation-engine-service.ts` (Step 4): lifecycle `requested→accepted→executing→done|rejected`; resolves agents via `AgentResolverDirectory`; delegates execution to `scenarioRepository`+`conversationDirectorService` (chat/director) or `debateService` (debate).
- `invocationStore.ts`: observer over `invocation:*` + `conversation:*`; `loadHistory()` merges persisted invocations.

## Top gaps

- **FE-07 unscoped live feed** — feed not keyed to active session; unrelated events pollute it. → R-06 / C12.
- **FE-06 misleading "Clear"** — clears local view, history persists separately (by design, but confusing). → UX copy + split "Clear view" / "Clear history".
- **UX-05 status over-promises for debate** — shows `done` before debate session settles. → scope status to real target lifecycle.
- **FE-09 checkpoint staleness** — Director checkpoint list leaks stale state into Room session view.
- **Single-agent only** — `AgentGroup` (`agent-service.ts:25`) execution patterns not invocable. → R-26 / C4.
- **No Scheduler entry** — schedules can't invoke via Room (R-21).

## Roadmap (phased)

1. **Scope the feed (S).** Shared `SessionScopedStore` keyed by `sessionRef`; fixes FE-07 + helps Debate/Forum. (R-06)
2. **Honest status + Clear semantics (S).** Map Room status to actual execution target; split Clear view vs Clear history. (UX-05/FE-06)
3. **Agent Groups (M).** `invocationEngine` accepts `target.kind:'group'`; Room offers "Agent" or "Group". (R-26)
4. **Scheduler bridge (S, cross-cutting).** `SCHEDULE_TRIGGERED` → `invoke`. Room becomes the visible surface for scheduled runs. (R-21)
5. **Rich session cards (M).** Show live turn log, token cost, participant avatars from `agentService`. Reuse Director RunTab patterns.

## Value / Effort

Hub of cohesion. Steps 1–2 are S and remove the worst UX confusion; step 4 is the cheapest high-value cross-module connector. **Priority: P1.**
