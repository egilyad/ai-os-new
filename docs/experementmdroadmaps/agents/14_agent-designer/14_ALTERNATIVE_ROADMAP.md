# 14_ALTERNATIVE_ROADMAP — Plan B (Design Studio: multi-agent, not one node)

Philosophy: **instead of beefing one node, treat design as a small coordinated team** — a
"Design Studio" of specialized sub-agents. Trade-offs vs Plan A.

## Shape of Plan B

- Spin a **Design Group** (`AgentService.createGroup`, `agent-service.ts:667`) of
  `agent-designer` + `agent-ux` + `agent-creative` (the Creative cluster, already grouped in
  `prompt-audit-service.ts:22`) with `executionPattern:'consensus'` or `'pipeline'`.
- Add a **design-orchestration scenario** in Conversation Director (Module: ConversationCore,
  already built in B3–B6) where the three run a pipeline: researcher → designer → creative.
- Surface a **Design Studio panel** reusing `AgentGroupsSection` + `DirectorPanel` Run UI.

## Trade-offs vs Plan A

| Dimension             | Plan A (activate 1 node)                | Plan B (Design Studio team)                     |
| --------------------- | --------------------------------------- | ----------------------------------------------- |
| New code              | Minimal (wiring + 2 data items)         | Moderate (group orchestration, panel)           |
| Risk                  | Low                                     | Med (group execution, consensus tuning)         |
| Token cost            | 1 agent call                            | 3 agent calls per design task                   |
| Specialization depth  | Relies on `specializations` injection   | True role separation (UX vs visual vs creative) |
| Reuse                 | persona/lens/journal/crystal/invocation | + Groups + Director scenarios                   |
| Time-to-value         | Fast (Phase 0–1 ship in days)           | Slower (needs group + scenario UX)              |
| Fit with architecture | Perfect (no new subsystem)              | Good, but introduces a "studio" concept         |

## When Plan B wins

- When design tasks genuinely need **divergent** perspectives (UX research vs visual vs narrative)
  that a single `specializations` line cannot capture.
- When the Creative cluster is already co-debating and a formal studio reduces ad-hoc routing.

## When Plan A wins

- Faster, cheaper, lower-risk; sufficient because `specializations` already encode the three facets.
- Avoids a second "design" abstraction the AGENTS.md warns against (see `15_DO_NOT_BUILD_YET.md`).

## Recommendation (OPINION)

**Start with Plan A** (Phases 0–2 ship immediately, near-zero risk). Adopt Plan B's _group_ idea
only as a Phase 5 extension, reusing `createGroup` + Director — not a new studio subsystem.
