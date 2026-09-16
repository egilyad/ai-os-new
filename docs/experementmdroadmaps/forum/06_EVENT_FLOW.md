# 06 — Forum Event Flow

> Research-only. Tags: **[VERIFIED]** (file:line), **[INFERRED]**, **[OPINION]**.

## 0. Critical pre-finding — Forum UI does not import its service

`ForumPanel.tsx:4` does `import { forumService } from '../../kernel/instances';`, but
**no `forumService` export exists** in `instances/` (`services-core.ts`, `services-extras.ts`,
`extra-references.ts`, `infra.ts`, `core-references.ts` — grep returns zero matches for
`forum`). LSP confirms: `Module '"../../kernel/instances"' has no exported member 'forumService'`
(`ForumPanel.tsx:4:10`). The `forumService` register token exists (`phase18-forum.ts:32`) but is
**never surfaced as a lazy service** (contrast `conversationDirector` at `services-extras.ts:173`).
**[VERIFIED]** → **[OPINION]** The Forum UI likely fails at typecheck/import today; AGENTS.md
claim "forumService lazyService exposed" is stale. Either add
`export const forumService = lazyService<IForumService>('forumService')` or fix the import.

## 1. Forum-originated events (producers)

Defined in `event-registry.ts:1391-1417`. **Only three** forum events exist:

| Event                 | Name                  | Payload                             | Producer                   |
| --------------------- | --------------------- | ----------------------------------- | -------------------------- |
| `FORUM_TOPIC_CREATED` | `forum:topic:created` | `{topicId,title,category,authorId}` | `forum-service.ts:80-85`   |
| `FORUM_POST_ADDED`    | `forum:post:added`    | `{postId,topicId,authorId}`         | `forum-service.ts:140-144` |
| `FORUM_POST_VOTED`    | `forum:post:voted`    | `{postId,topicId,voterId,vote}`     | `forum-service.ts:187-192` |

Emit pattern: each service method emits **after** persistence in the same call
(async, fire-and-forget via `eventBus.emit`). No transaction wraps emit+persist
[VERIFIED].

## 2. A fourth, advertised-but-missing event

`forum:topic:escalated-to-debate` is referenced in `AGENTS.md` ("forum:topic:escalated-to-debate"
bridge) and in the **negative test** `forum-service.test.ts:307`
(`expect(events).not.toContain('forum:topic:escalated-to-debate')`). But:

- It is **NOT defined** in `event-registry.ts` (only the 3 above).
- It is **NEVER emitted** by `forum-service.ts` (grep: zero occurrences in source).
- **No consumer** listens for it.

**[VERIFIED]** The escalation event is purely aspirational — declared in docs/test, absent in code.
This is the root of the "Forum→Debate escalation DEAD" finding (see `08_DEBATE_INTEGRATION.md`).

## 3. Consumers of forum events

| Event                 | Consumers                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `FORUM_TOPIC_CREATED` | **NONE** (orphan; only emitted + asserted in test)                 |
| `FORUM_POST_ADDED`    | **ONE** — `wireForumToGeneratorBridge` (`phase18-forum.ts:83-114`) |
| `FORUM_POST_VOTED`    | **NONE** (orphan)                                                  |

`wireForumToGeneratorBridge` logic (`phase18-forum.ts:82-114`):

1. Skips if `authorId === 'system'` (avoid loops from the phase18 bridges themselves).
2. Loads thread, finds the post, tests `QUESTION_PATTERN`
   (`/(\?$|вопрос|как |почему |...)/i`, `:26-27`).
3. If matched → `knowledgeGen.generateFromTrigger({kind:'forum-question', topicId})`.
   The trigger kind is handled in `knowledge-generator-service.ts:450` and typed at
   `generator-types.ts:15`. i18n label exists (`analytics.ts:296/297`).

**[VERIFIED]** So the _only_ live outbound forum event consumer is the knowledge-generator bridge.

## 4. Inbound bridges (events → Forum posts)

In `phase18-forum.ts`, two bridges consume **non-forum** events and write **into** the forum as
`SYSTEM_AUTHOR` (`kind:'agent', id:'system'`, `:24`):

| Inbound event              | Source                                                                               | Action                                        | Line     |
| -------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- | -------- |
| `DEBATE_VERDICT_GENERATED` | `debate:verdict:generated` (`event-registry.ts:825`, payload `{sessionId, verdict}`) | ensure `case-study` topic + post summary      | `:48-64` |
| `CRYSTAL_FORMED`           | crystal event                                                                        | ensure `announcements` topic + post statement | `:66-79` |

`ensureTopic` (`:116-119`) is idempotent: returns the first existing topic in the category, else
creates one. Both bridges wrap in `try/catch` and `LOGGER.warn` on failure (never throw into the
emitter). **[VERIFIED]** These are the **real** debate→forum and crystal→forum connections.

## 5. Full lifecycle event map

```
Topic created ──FORUM_TOPIC_CREATED──► (no consumer)
   │
   ├─ Post added ──FORUM_POST_ADDED──► wireForumToGeneratorBridge
   │                                     └─► knowledgeGen (forum-question)
   │                                        (NOT back into forum)
   │
   ├─ Vote ────────FORUM_POST_VOTED──► (no consumer)
   │
   ├─ Moderate ──── (NO EVENT emitted) ──► silent; only ForumService state changes
   │
   ├─ Consensus ───getConsensus() ───► (NO EVENT; not persisted; pull-only in UI)
   │
   ├─ [advertised] Contested ──forum:topic:escalated-to-debate──► (NEVER EMITTED/DEFINED)
   │
   ├─ Debate verdict ─DEBATE_VERDICT_GENERATED─► wireForumBridge ──► case-study post
   │
   └─ Crystal formed ─CRYSTAL_FORMED─► wireForumBridge ──► announcement post
```

## 6. Emitted-but-unconsumed & consumers-waiting-for-never-fired

- **Emitted, no consumer:** `FORUM_TOPIC_CREATED`, `FORUM_POST_VOTED`.
  **[INFERRED]** A UI reactive store (like `directorStore`/`useInvocationStore`) could subscribe
  to these to live-update topic lists / vote counts without manual refresh, but none exists.
- **Consumer waiting for event that never fires:** the `forum:topic:escalated-to-debate`
  escalation — expected by docs/test, produced by nothing.
- **Silent state transitions (no event):** moderation (`moderatePost`, `forum-service.ts:245`)
  and consensus (`getConsensus`) emit nothing. Any external subscriber (notifications, audit,
  analytics) is blind to them. **[OPINION]** Adding `FORUM_POST_MODERATED` and a
  `FORUM_TOPIC_CONSENSUS` (or fixing `escalated-to-debate`) would close these blind spots.

## 7. Duplicated state across events/persistence

- Vote is stored **twice**: `forumVotes` row + `post.votes[]` (see `05_DATA_AND_PERSISTENCE.md` §7).
  `FORUM_POST_VOTED` fires once but two stores update.
- Topic score + post score both bumped on vote (`forum-service.ts:174-185`) — score is
  denormalized into the topic header for list sorting (`listTopics` sorts by `lastActivityAt`,
  not score, so score is display-only in `TopicList.tsx:45`).
- `DEBATE_VERDICT_GENERATED` payload carries `verdict` (full object) but the forum case-study
  post stores only a **lossy one-liner** (`"Итог дебатов …: зафиксирован вердикт (авто-пост)"`,
  `phase18-forum.ts:57`). The rich verdict lives in `debateVerdicts` Dexie table
  (`dexie-schema.ts:1141`) — duplicated, degraded copy in forum.

## 8. Notifications

No forum event ever emits `EVENTS.NOTIFICATION` (grep: forum not among the 125 NOTIFICATION
emitters). Subscriptions (`forumSubs`) are stored but never read to notify
(see `05` §5). **[VERIFIED]** → forum notifications are **N/A / not implemented**.

## 9. UI is pull-based, not event-driven

Every `ForumPanel` view refresh is a manual `await forumService.listTopics/getThread/getConsensus`
(`ForumPanel.tsx:29-45,52-69`) triggered by user action or `useEffect` on mount. There is **no
event subscription** in any `ForumPanel/*` component (grep: no `onSafe`/`eventBus`/`subscribe` in
the panel). `[VERIFIED]` The three forum events therefore have **zero UI effect** today.
