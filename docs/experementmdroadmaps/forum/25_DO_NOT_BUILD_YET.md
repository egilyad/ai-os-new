# 25 — FORUM: DO NOT BUILD YET

> Research-only. Read-only analysis. No source changes, no git, no commit.
> Every "why not now" and "trigger condition" is grounded in a VERIFIED gap
> (`file:line`) or explicitly marked INFERRED/OPINION. Scope-discipline list for
> the Forum subsystem — things that look attractive but would waste effort or add
> broken promises given the current state.

---

## (a) Rebuild the Forum engine / new forum service — DO NOT BUILD

- **Why not now:** `ForumService` (`src/kernel/services/forum/forum-service.ts:37`) is a complete, unit-tested async thread orchestrator (createTopic/postMessage/votePost/subscribe/listTopics/getThread/pinTopic/moderatePost/getConsensus — `forum-service.ts:60-308`). `ForumRepository` (`src/kernel/dal/forum-repository.ts:4-8`) already wraps four Dexie tables (`forumTopics`/`forumPosts`/`forumVotes`/`forumSubs`). A rewrite duplicates a working backend.
- **Risk of building:** Very high — massive duplication, regression of the tested consensus/moderation/voting logic, orphaned migration of Dexie v17 schema.
- **Trigger condition:** Only if a measured architectural limit appears (e.g., `IForumService` contract cannot express a required capability) — none known.
- **Label:** VERIFIED (engine + repository exist and are wired).

## (b) Forum → Debate escalation as a NEW subsystem — DO NOT BUILD (yet)

- **Why not now:** The escalation event is **declared but never emitted**. The only source reference to `forum:topic:escalated-to-debate` is a test asserting it is **not** contained in emitted events (`src/kernel/services/forum/forum-service.test.ts:307`). It is **not** in `event-registry.ts` (grep found only the 3 real FORUM events: `FORUM_TOPIC_CREATED` `event-registry.ts:1392`, `FORUM_POST_ADDED` `:1401`, `FORUM_POST_VOTED` `:1409`). There is no producer, and `getConsensus` returning `contested` has no action wired (`forum-service.ts:300-306` lives dormant).
- **Risk of building:** Medium — wiring a producer with no consumer demand creates an orphan event (same anti-pattern as the dropped `cognitive:*` path, see debate `22_DEBATE_DO_NOT_BUILD_YET.md` (d)). The proper route already exists via **Invocation** (`phase21-invocation.ts:75-87` routes `mode:'debate'` → `debateService.startDebate`), so a separate escalation subsystem is redundant.
- **Trigger condition:** A verified product request for "promote contested thread → debate" with a moderator-approval flow, implemented by emitting an event AND calling `invocationEngine.invoke({mode:'debate', context:{type:'forum-topic', ref}})`. Reuse Invocation; do not build a second escalation path.
- **Label:** VERIFIED (event never emitted; only test reference; Invocation debate handoff already exists).

## (c) Expand Invocation Engine for Forum without proof — DO NOT BUILD (yet)

- **Why not now:** The Invocation Engine already routes forum → debate/chat/director (`phase21-invocation.ts:61-109`). It is intentionally narrow (intent lifecycle only, D5/D7 per `docs/road/INVOCATION_ENGINE.md`). Growing it into a forum-scheduling/orchestration layer duplicates (a) and bloats a thin dispatch layer.
- **Risk of building:** Medium — scope creep of a dispatch layer into a forum service, violating its fixed design decisions.
- **Trigger condition:** A concrete, human-demanded forum-invocation policy (e.g., expertise-matched auto-answering) with a verified policy model — not speculative.
- **Label:** VERIFIED (minimal engine exists & wired to debateService + director).

## (d) New search microservice for Forum — DO NOT BUILD (yet)

- **Why not now:** `listTopics` (`forum-service.ts:209-221`) supports `category/authorId/status/tag` filters natively; `ForumRepository.listTopics` (`forum-repository.ts:34-49`) already filters + sorts by `lastActivityAt`. A dedicated search engine duplicates this. Full-text search is a UI+index concern, not a new kernel service.
- **Risk of building:** Low–Medium — over-engineering; a new service would need its own persistence and sync, introducing drift vs the canonical `forumTopics` table.
- **Trigger condition:** When topic count exceeds a few hundred and `toArray()`-then-filter (`forum-repository.ts:41`) becomes a measured perf problem; then add a Dexie index/`where` clause in the existing repository, not a new service.
- **Label:** VERIFIED (filtering exists in repo); INFERRED (perf threshold not yet reached).

## (e) Real-time Forum websocket / streaming layer — DO NOT BUILD (yet)

- **Why not now:** The existing `IEventBus` already emits `FORUM_POST_ADDED`/`FORUM_POST_VOTED` (`event-registry.ts:1401/1409`). Live update is a client-side `eventBus.onSafe` subscription + refresh, not a new transport. `directorStore`/`invocationStore` already demonstrate the event→Zustand observer pattern (`AGENTS.md` B4/B5). Building a websocket server duplicates the bus.
- **Risk of building:** Medium — new server infra, auth, reconnect logic; high maintenance for marginal gain over the in-process bus the app already uses per-panel.
- **Trigger condition:** When Forum runs across multiple browser clients / remote agents and the in-process bus is insufficient; then bridge `FORUM_*` events through the existing realtime transport (if one exists for debates) rather than a bespoke forum socket.
- **Label:** INFERRED (no multi-client requirement verified); VERIFIED (events exist).

## (f) Forum reputation / gamification engine — DO NOT BUILD (yet)

- **Why not now:** `Topic.score` and `Post.score` already aggregate votes (`forum-service.ts:174-185`). Reputation is derivable from existing vote data; a separate engine would re-summarize what the repository already stores.
- **Risk of building:** Low — but adds a second source of truth and UI complexity with no current demand (no product request for badges/leaderboards verified).
- **Trigger condition:** A verified community/moderation need for contributor standing; then compute from `forumVotes` in the existing repo, surface in `AuthorBadge`.
- **Label:** OPINION (low risk, but premature).

## (g) Threaded-reply data model change — DO NOT BUILD (yet)

- **Why not now:** `Post.parentId` **already exists** in the type (`forum-types.ts:51`) and record (`forum-types.ts:143`). The gap is purely UI: `PostComposer` (`PostComposer.tsx`) never sets a parent, and `postMessage` (`forum-service.ts:93-147`) takes no `parentId` param. Changing the schema is unnecessary — the field is already there.
- **Risk of building:** None for schema; the trap is _assuming_ a model change is needed and rewriting types. Fix the UI + `postMessage` signature instead.
- **Trigger condition:** Never (schema is fine). Only build the composer "Reply" affordance.
- **Label:** VERIFIED (parentId present; no producer).

## (h) Forum moderation role/authorization system — DO NOT BUILD (yet)

- **Why not now:** `ModerationQueue` (`ModerationQueue.tsx`) and `TopicView` hide/remove buttons (`TopicView.tsx:51-63`) **already call `moderatePost`** (`forum-service.ts:245`). The gap is that **any** `local-user` can moderate (ForumPanel uses a fixed `currentAuthor` `ForumPanel.tsx:11-15`) — there is no role gate. A full RBAC/moderation-role subsystem is premature; a simple `author.roleId` check at the call site suffices.
- **Risk of building:** Medium — building an RBAC service duplicates the platform's existing agent/human identity model (`agent-identity`, `AuthorBadge.tsx:4-5`).
- **Trigger condition:** When multiple human users exist and privilege abuse is a real risk; then gate `onModerate` by `author.kind`/role using the existing identity system.
- **Label:** VERIFIED (moderation UI exists, ungated).

---

## Summary table

| Item                                  | Verdict | Core reason                                                                                          | Trigger                    |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| (a) New forum engine                  | ❌      | Engine exists & tested (`forum-service.ts:37`)                                                       | Architectural limit proven |
| (b) Forum→debate escalation subsystem | ❌      | Event never emitted (`forum-service.test.ts:307`); Invocation covers it (`phase21-invocation.ts:75`) | Product request + flow     |
| (c) Expand Invocation for forum       | ❌      | Minimal engine already routes debate/chat                                                            | Human-demanded policy      |
| (d) Forum search microservice         | ❌      | Filters exist in repo (`forum-repository.ts:34`)                                                     | Measured perf limit        |
| (e) Forum websocket layer             | ❌      | Events exist on bus (`event-registry.ts:1401`)                                                       | Multi-client need          |
| (f) Reputation engine                 | ❌      | Scores already aggregated (`forum-service.ts:174`)                                                   | Community need             |
| (g) Threading schema change           | ❌      | `parentId` already exists (`forum-types.ts:51`)                                                      | Never (UI only)            |
| (h) Moderation RBAC                   | ❌      | Moderation UI ungated (`ForumPanel.tsx:11`)                                                          | Multi-user privilege risk  |

_Labels: VERIFIED = Read/Grep on source; INFERRED = reasoned from verified neighbors;
OPINION = judgment._
