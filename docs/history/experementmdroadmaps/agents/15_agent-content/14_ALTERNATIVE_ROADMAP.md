# 14 — ALTERNATIVE ROADMAP (Philosophy B: agent-specialized content subsystem)

A second philosophy and its trade-offs vs Philosophy A (13_ROADMAP).

## Philosophy B thesis

Instead of composing generic infra, introduce a **dedicated content subsystem** that owns content semantics end-to-end: a `ContentStrategyService` + content schema (briefs, drafts, revisions, SEO reports) + a `ContentWorkspacePanel` + content-specific tools (SERP, readability, plagiarism) + a content event family (`content:draft:created`, `content:seo:scored`, etc.).

### What B would build that A does not

- A first-class `ContentBrief` / `ContentArtifact` data model (Dexie tables), not just chat text.
- A `ContentStrategyService` that orchestrates draft→review→publish with content-aware logic (tone graph, brand-voice diff, channel adaptation).
- Content-native UI (editor, SEO sidebar, calendar) rather than reusing generic agent/Debate/Director surfaces.
- Content events decoupled from `COGNITIVE_STEP_COMPLETED`.

## Trade-offs vs A

| Dimension           | A (compose infra)                                       | B (dedicated subsystem)                                                                 |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Time to first value | Days (QW items)                                         | Months (model+service+UI+events)                                                        |
| Architecture fit    | ✅ Matches AGENTS.md ("agents are nodes; shared infra") | ⚠️ Introduces agent-specific service — contradicts the "no agent-specific service" rule |
| Reuse               | Maximum (lens/tool/Director/Forum/Invocation)           | Low (new model duplicated from memory/journal)                                          |
| Maintenance         | Shared, 25-agent benefit                                | Siloed, only `agent-content` benefits                                                   |
| Flexibility         | Generic (any agent can use lens/tool)                   | Content-locked                                                                          |
| Risk                | Low-Medium (composition bugs)                           | High (new subsystem, new tables, new events, migration)                                 |
| "Lena" depth        | Emergent, capped by generic primitives                  | Deep, purpose-built                                                                     |

## When B would be justified (OPINION)

Only if content becomes a **primary product surface** with requirements generic infra cannot meet:

- Structured, queryable content artifacts across the whole org (not just Lena's).
- Compliance/brand enforcement with audit trails stricter than memory-journal offers.
- Multi-channel publishing (CMS, social, email) with format adapters.
  Absent those, B is over-engineering.

## Recommended hybrid (OPINION)

Adopt **A as the default**, but design the Phase 4 skill pack (BIG-1) so that the _content lens + tools + objective types_ are **reusable primitives**, not Lena-locked. If, later, content demand explodes, promote those primitives into a `ContentWorkspacePanel` (B's UI) **without** a dedicated `ContentStrategyService` — keep orchestration on Director/Builder/ConversationCore. This captures B's UX depth while preserving A's architecture discipline.

## Risk of choosing B prematurely

- Violates the established dependency rule (UI → App → Kernel → Infra) and "no agent-specific service in kernel."
- Creates a 26th code-path that must be maintained alongside the 25-agent generic path — exactly the "25 mini-frameworks" trap warned in 15_DO_NOT_BUILD_YET.
